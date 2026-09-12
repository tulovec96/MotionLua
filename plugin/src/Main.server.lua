--!nonstrict
-- Deliberately not --!strict: this file resolves instances and properties
-- by dynamic runtime strings (paths, property names) throughout, which is
-- exactly the pattern strict mode's type checker fights against. The
-- scripts this plugin WRITES into a place (see the write_script handler
-- below) still follow the system prompt's --!strict convention — that
-- rule is about generated game code, not this meta-level glue script.
--[[
	RobloAI Studio Plugin

	A single-file plugin, deliberately not split into a handler-per-module
	system: this file can only be exercised inside real Roblox Studio, which
	isn't available in the environment this was built in, so keeping
	everything in one place (and easy to read top-to-bottom) matters more
	here than the modularity that would make sense for a codebase you can
	actually run tests against.

	Responsibilities:
	  1. A DockWidget GUI for pairing (enter the 6-digit code shown at
	     /settings/plugin on the web app) and watching connection/activity.
	  2. A long-poll loop against the web app's bridge API
	     (POST {BASE_URL}/api/bridge/{code}/poll and .../result — see
	     app/api/bridge/[code]/{poll,result}/route.ts in the web app repo).
	  3. A dispatcher table with one function per tool name in
	     lib/ai/tool-registry.ts, operating on real Studio services.

	KNOWN PLATFORM LIMITATIONS (documented here rather than faked):
	  - Roblox Studio does not expose a stable, public Luau API for a plugin
	    to programmatically start/stop Play Solo. `playtest`/`start_playtest`
	    below report this rather than pretending to control it.
	  - Plugins have no public API to capture and export a viewport image to
	    an external URL. `screenshot`/`capture_viewport` report the same.
	  Both are called out explicitly in their handler's result rather than
	  silently no-op'd, so the chat UI's step card shows the real limitation.
]]

-- ---------------------------------------------------------------------------
-- Config
-- ---------------------------------------------------------------------------

-- Point this at your deployed app, or http://localhost:3000 for local dev.
local BASE_URL = "http://localhost:3000"
local POLL_INTERVAL_SECONDS = 2.5
local SETTING_KEY_PAIRING_CODE = "RobloAI_PairingCode"

-- ---------------------------------------------------------------------------
-- Services
-- ---------------------------------------------------------------------------

local HttpService = game:GetService("HttpService")
local Selection = game:GetService("Selection")
local InsertService = game:GetService("InsertService")
local AssetService = game:GetService("AssetService")

-- ---------------------------------------------------------------------------
-- State
-- ---------------------------------------------------------------------------

local pairingCode: string? = nil
local connected = false
local running = false

-- ---------------------------------------------------------------------------
-- GUI
-- ---------------------------------------------------------------------------

local toolbar = plugin:CreateToolbar("RobloAI")
local toggleButton = toolbar:CreateButton(
	"RobloAI",
	"Open the RobloAI pairing panel",
	"rbxasset://textures/ui/GuiImagePlaceholder.png"
)

local widgetInfo = DockWidgetPluginGuiInfo.new(
	Enum.InitialDockState.Right,
	false, -- initially enabled
	false, -- override previous enabled state
	280,
	360,
	220,
	200
)
local widget = plugin:CreateDockWidgetPluginGui("RobloAIPanel", widgetInfo)
widget.Title = "RobloAI"

local root = Instance.new("Frame")
root.Size = UDim2.fromScale(1, 1)
root.BackgroundColor3 = Color3.fromRGB(15, 15, 18)
root.BorderSizePixel = 0
root.Parent = widget

local layout = Instance.new("UIListLayout")
layout.Padding = UDim.new(0, 8)
layout.SortOrder = Enum.SortOrder.LayoutOrder
layout.Parent = root

local padding = Instance.new("UIPadding")
padding.PaddingTop = UDim.new(0, 10)
padding.PaddingLeft = UDim.new(0, 10)
padding.PaddingRight = UDim.new(0, 10)
padding.Parent = root

local codeBox = Instance.new("TextBox")
codeBox.LayoutOrder = 1
codeBox.Size = UDim2.new(1, 0, 0, 32)
codeBox.PlaceholderText = "Pairing code"
codeBox.Text = ""
codeBox.Font = Enum.Font.Code
codeBox.TextSize = 18
codeBox.BackgroundColor3 = Color3.fromRGB(30, 30, 36)
codeBox.TextColor3 = Color3.fromRGB(240, 240, 245)
codeBox.Parent = root

local connectButton = Instance.new("TextButton")
connectButton.LayoutOrder = 2
connectButton.Size = UDim2.new(1, 0, 0, 30)
connectButton.Text = "Connect"
connectButton.BackgroundColor3 = Color3.fromRGB(139, 92, 246)
connectButton.TextColor3 = Color3.new(1, 1, 1)
connectButton.Font = Enum.Font.SourceSansBold
connectButton.TextSize = 15
connectButton.Parent = root

local statusLabel = Instance.new("TextLabel")
statusLabel.LayoutOrder = 3
statusLabel.Size = UDim2.new(1, 0, 0, 20)
statusLabel.BackgroundTransparency = 1
statusLabel.Text = "Not connected"
statusLabel.TextColor3 = Color3.fromRGB(180, 180, 190)
statusLabel.Font = Enum.Font.SourceSans
statusLabel.TextSize = 13
statusLabel.TextXAlignment = Enum.TextXAlignment.Left
statusLabel.Parent = root

local logFrame = Instance.new("ScrollingFrame")
logFrame.LayoutOrder = 4
logFrame.Size = UDim2.new(1, 0, 1, -100)
logFrame.BackgroundColor3 = Color3.fromRGB(20, 20, 24)
logFrame.BorderSizePixel = 0
logFrame.ScrollBarThickness = 6
logFrame.CanvasSize = UDim2.new(0, 0, 0, 0)
logFrame.AutomaticCanvasSize = Enum.AutomaticSize.Y
logFrame.Parent = root

local logLayout = Instance.new("UIListLayout")
logLayout.SortOrder = Enum.SortOrder.LayoutOrder
logLayout.Parent = logFrame

local logCount = 0
local MAX_LOG_LINES = 100

local function log(message: string)
	logCount += 1
	if logCount > MAX_LOG_LINES then
		local first = logFrame:FindFirstChildOfClass("TextLabel")
		if first then
			first:Destroy()
		end
	end

	local line = Instance.new("TextLabel")
	line.LayoutOrder = logCount
	line.Size = UDim2.new(1, 0, 0, 16)
	line.BackgroundTransparency = 1
	line.Text = os.date("%H:%M:%S") .. "  " .. message
	line.TextColor3 = Color3.fromRGB(200, 200, 210)
	line.Font = Enum.Font.Code
	line.TextSize = 12
	line.TextXAlignment = Enum.TextXAlignment.Left
	line.Parent = logFrame
end

local function setStatus(text: string, color: Color3)
	statusLabel.Text = text
	statusLabel.TextColor3 = color
end

-- ---------------------------------------------------------------------------
-- HTTP helper
-- ---------------------------------------------------------------------------

local function httpPost(path: string, bodyTable: { [string]: any }): (boolean, any)
	local ok, response = pcall(function()
		return HttpService:RequestAsync({
			Url = BASE_URL .. path,
			Method = "POST",
			Headers = { ["Content-Type"] = "application/json" },
			Body = HttpService:JSONEncode(bodyTable),
		})
	end)

	if not ok then
		return false, response
	end
	if not response.Success then
		return false, response.StatusMessage
	end

	local decodeOk, decoded = pcall(function()
		return HttpService:JSONDecode(response.Body)
	end)
	if not decodeOk then
		return false, "Failed to decode response JSON"
	end
	return true, decoded
end

-- ---------------------------------------------------------------------------
-- Path resolution — "Service/Child/Grandchild" style paths, matching the
-- shape lib/ai/tool-registry.ts's mock fixtures already use.
-- ---------------------------------------------------------------------------

local function resolveInstance(path: string): Instance?
	local segments = string.split(path, "/")
	if #segments == 0 then
		return nil
	end

	-- game:GetService errors (rather than returning nil) for an unrecognized
	-- name, so the lookup itself must be pcall-wrapped.
	local ok, current = pcall(function(): Instance
		return game:GetService(segments[1] :: any)
	end)
	if not ok or current == nil then
		return nil
	end

	for i = 2, #segments do
		current = current:FindFirstChild(segments[i])
		if current == nil then
			return nil
		end
	end
	return current
end

local function instancePath(instance: Instance): string
	local parts = { instance.Name }
	local current = instance.Parent
	while current ~= nil and current ~= game do
		table.insert(parts, 1, current.Name)
		current = current.Parent
	end
	return table.concat(parts, "/")
end

-- ---------------------------------------------------------------------------
-- Tool dispatcher — one function per name in lib/ai/tool-registry.ts
-- ---------------------------------------------------------------------------

local handlers: { [string]: (payload: any) -> any } = {}

handlers["get_file_tree"] = function(payload)
	local rootInstance: Instance = (payload.root and resolveInstance(payload.root)) or game
	local tree = {}
	local function walk(instance: Instance, depth: number)
		if depth > 4 then
			return
		end
		for _, child in ipairs(instance:GetChildren()) do
			table.insert(tree, { path = instancePath(child), className = child.ClassName })
			walk(child, depth + 1)
		end
	end
	walk(rootInstance, 0)
	return { root = payload.root or "game", tree = tree }
end

handlers["read_script"] = function(payload)
	local instance = resolveInstance(payload.path)
	if instance == nil or not instance:IsA("LuaSourceContainer") then
		error("No Script/ModuleScript at path: " .. payload.path)
	end
	local content = (instance :: LuaSourceContainer).Source
	local lines = 1
	for _ in string.gmatch(content, "\n") do
		lines += 1
	end
	return { path = payload.path, content = content, lines = lines }
end

handlers["search_instances"] = function(payload)
	local results = {}
	for _, instance in ipairs(game:GetDescendants()) do
		if string.find(string.lower(instance.Name), string.lower(payload.query), 1, true)
			and (payload.className == nil or instance.ClassName == payload.className)
		then
			table.insert(results, { path = instancePath(instance), className = instance.ClassName })
			if #results >= 25 then
				break
			end
		end
	end
	return { query = payload.query, results = results }
end

handlers["get_selection"] = function(_payload)
	local results = {}
	for _, instance in ipairs(Selection:Get()) do
		table.insert(results, { path = instancePath(instance), className = instance.ClassName })
	end
	return { selection = results }
end

handlers["get_properties"] = function(payload)
	local instance = resolveInstance(payload.path)
	if instance == nil then
		error("No instance at path: " .. payload.path)
	end
	local commonProps = { "Name", "ClassName", "Anchored", "CanCollide", "Transparency", "Enabled" }
	local properties: { [string]: string } = {}
	for _, propName in ipairs(commonProps) do
		local ok, value = pcall(function()
			return (instance :: any)[propName]
		end)
		if ok and value ~= nil then
			properties[propName] = tostring(value)
		end
	end
	return { path = payload.path, properties = properties }
end

handlers["write_script"] = function(payload)
	local instance = resolveInstance(payload.path)
	local before = ""
	if instance and instance:IsA("LuaSourceContainer") then
		before = (instance :: LuaSourceContainer).Source
	else
		-- Create a ModuleScript at the given path, making Folder ancestors as needed.
		local segments = string.split(payload.path, "/")
		local current: Instance = game:GetService(segments[1])
		for i = 2, #segments - 1 do
			local child = current:FindFirstChild(segments[i])
			if child == nil then
				child = Instance.new("Folder")
				child.Name = segments[i]
				child.Parent = current
			end
			current = child
		end
		local newScript = Instance.new("ModuleScript")
		newScript.Name = segments[#segments]
		newScript.Parent = current
		instance = newScript
	end
	(instance :: LuaSourceContainer).Source = payload.content
	return { path = payload.path, before = before, after = payload.content, summary = payload.summary }
end

handlers["create_instance"] = function(payload)
	local parent = resolveInstance(payload.parent)
	if parent == nil then
		error("No parent instance at path: " .. payload.parent)
	end
	local instance = Instance.new(payload.className)
	instance.Name = payload.name
	instance.Parent = parent
	return { path = instancePath(instance), className = payload.className }
end

handlers["set_properties"] = function(payload)
	local instance = resolveInstance(payload.path)
	if instance == nil then
		error("No instance at path: " .. payload.path)
	end
	local before: { [string]: string } = {}
	for key, newValue in pairs(payload.properties) do
		local ok, oldValue = pcall(function()
			return (instance :: any)[key]
		end)
		before[key] = ok and tostring(oldValue) or "<unknown>"
		pcall(function()
			(instance :: any)[key] = newValue
		end)
	end
	return { path = payload.path, before = before, after = payload.properties }
end

handlers["delete_instance"] = function(payload)
	local instance = resolveInstance(payload.path)
	if instance == nil then
		error("No instance at path: " .. payload.path)
	end
	instance:Destroy()
	return { path = payload.path, deleted = true }
end

handlers["execute_luau"] = function(payload)
	-- Plugins run with elevated permissions and may use loadstring, unlike
	-- regular in-game scripts. Still sandboxed to whatever the plugin
	-- process itself can reach.
	local compiled, compileError = loadstring(payload.code)
	if compiled == nil then
		error("Compile error: " .. tostring(compileError))
	end
	local ok, result = pcall(compiled)
	if not ok then
		error("Runtime error: " .. tostring(result))
	end
	return { code = payload.code, output = tostring(result) }
end

handlers["batch_execute"] = function(payload)
	local results = {}
	for _, operation in ipairs(payload.operations) do
		local handler = handlers[operation.type]
		if handler then
			local ok, result = pcall(handler, operation)
			table.insert(results, { path = operation.path, ok = ok, result = result })
		end
	end
	return { count = #payload.operations, results = results }
end

handlers["playtest"] = function(payload)
	return {
		action = payload.action,
		status = "unsupported",
		note = "Roblox Studio has no public plugin API to start/stop Play Solo programmatically. "
			.. "Use the Play button in Studio, or the keyboard shortcut, and RobloAI will pick up "
			.. "console output once running.",
	}
end
handlers["start_playtest"] = function(payload)
	return handlers["playtest"]({ action = "start" })
end

handlers["screenshot"] = function(_payload)
	return {
		capturedAt = DateTime.now():ToIsoDate(),
		note = "Roblox Studio plugins have no public API to export a viewport image to an external URL.",
	}
end
handlers["capture_viewport"] = handlers["screenshot"]

handlers["import_asset"] = function(payload)
	local ok, modelOrError = pcall(function()
		return InsertService:LoadAsset(tonumber(payload.assetId))
	end)
	if not ok then
		error(
			"LoadAsset failed — check that 'Allow third-party asset loading' is enabled for this place: "
				.. tostring(modelOrError)
		)
	end
	local container = modelOrError :: Model
	local imported = {}
	for _, child in ipairs(container:GetChildren()) do
		child.Parent = workspace
		table.insert(imported, child.Name)
	end
	container:Destroy()
	return { id = payload.assetId, name = payload.name, imported = true, children = imported }
end

handlers["import_bundle"] = function(payload)
	local ok, modelOrError = pcall(function()
		return InsertService:LoadAsset(tonumber(payload.bundleId))
	end)
	if not ok then
		error("LoadAsset failed: " .. tostring(modelOrError))
	end
	local container = modelOrError :: Model
	local count = #container:GetChildren()
	for _, child in ipairs(container:GetChildren()) do
		child.Parent = workspace
	end
	container:Destroy()
	return { id = payload.bundleId, itemCount = count, imported = true }
end

handlers["search_audio"] = function(payload)
	local ok, pages = pcall(function()
		local params = AudioSearchParams.new()
		params.SearchKeyword = payload.query
		return AssetService:SearchAudioAsync(params)
	end)
	if not ok then
		error("SearchAudioAsync failed: " .. tostring(pages))
	end
	local results = {}
	local items = pages:GetCurrentPage()
	for _, item in ipairs(items) do
		table.insert(results, {
			id = tostring(item.Id),
			title = item.Title,
			artist = item.Creator,
			duration = item.Duration,
		})
		if #results >= 10 then
			break
		end
	end
	return { query = payload.query, results = results }
end

handlers["get_audio_metadata"] = function(payload)
	local ok, pages = pcall(function()
		local params = AudioSearchParams.new()
		params.SearchKeyword = payload.assetId
		return AssetService:SearchAudioAsync(params)
	end)
	if ok then
		local items = pages:GetCurrentPage()
		if items[1] then
			return {
				id = payload.assetId,
				title = items[1].Title,
				artist = items[1].Creator,
				duration = items[1].Duration,
			}
		end
	end
	return { id = payload.assetId, title = "Unknown", artist = "Unknown", duration = 0 }
end

handlers["import_sound"] = function(payload)
	local parent = (payload.parent and resolveInstance(payload.parent)) or workspace
	local sound = Instance.new("Sound")
	sound.Name = "Sound_" .. payload.assetId
	sound.SoundId = "rbxassetid://" .. payload.assetId
	sound.Parent = parent
	return { id = payload.assetId, soundId = sound.SoundId, parent = instancePath(parent) }
end

handlers["import_animation"] = function(payload)
	local animation = Instance.new("Animation")
	animation.Name = "Animation_" .. payload.assetId
	animation.AnimationId = "rbxassetid://" .. payload.assetId
	animation.Parent = workspace
	return { id = payload.assetId, animationId = animation.AnimationId }
end

handlers["import_mesh"] = function(payload)
	local mesh = Instance.new("MeshPart")
	mesh.Name = "Mesh_" .. payload.assetId
	mesh.MeshId = "rbxassetid://" .. payload.assetId
	mesh.Parent = workspace
	return { id = payload.assetId, meshId = mesh.MeshId }
end

handlers["import_image"] = function(payload)
	local decal = Instance.new("Decal")
	decal.Name = "Image_" .. payload.assetId
	decal.Texture = "rbxassetid://" .. payload.assetId
	decal.Parent = workspace
	return { id = payload.assetId, imageId = decal.Texture }
end

-- ---------------------------------------------------------------------------
-- Poll loop
-- ---------------------------------------------------------------------------

local function runCommand(command: { id: string, type: string, payload: any })
	local handler = handlers[command.type]
	if handler == nil then
		httpPost("/api/bridge/" .. (pairingCode :: string) .. "/result", {
			commandId = command.id,
			status = "FAILED",
			error = "Unknown tool: " .. command.type,
		})
		log("Unknown tool: " .. command.type)
		return
	end

	local ok, result = pcall(handler, command.payload)
	if ok then
		httpPost("/api/bridge/" .. (pairingCode :: string) .. "/result", {
			commandId = command.id,
			status = "ACKED",
			result = result,
		})
		log(command.type .. " ok")
	else
		httpPost("/api/bridge/" .. (pairingCode :: string) .. "/result", {
			commandId = command.id,
			status = "FAILED",
			error = tostring(result),
		})
		log(command.type .. " FAILED: " .. tostring(result))
	end
end

local function pollLoop()
	while running and pairingCode do
		local ok, response = httpPost("/api/bridge/" .. pairingCode .. "/poll", {
			placeId = tostring(game.PlaceId),
			placeName = game.Name,
		})

		if ok and response.status == "connected" then
			if not connected then
				connected = true
				setStatus("Connected", Color3.fromRGB(52, 211, 153))
				log("Connected to " .. BASE_URL)
			end
			for _, command in ipairs(response.commands or {}) do
				runCommand(command)
			end
		else
			connected = false
			setStatus("Disconnected — retrying…", Color3.fromRGB(251, 191, 36))
		end

		task.wait(POLL_INTERVAL_SECONDS)
	end
end

-- ---------------------------------------------------------------------------
-- UI wiring
-- ---------------------------------------------------------------------------

local function startConnection(code: string)
	pairingCode = code
	plugin:SetSetting(SETTING_KEY_PAIRING_CODE, code)
	codeBox.Text = code
	if not running then
		running = true
		task.spawn(pollLoop)
	end
end

connectButton.MouseButton1Click:Connect(function()
	local code = codeBox.Text
	if #code == 0 then
		log("Enter a pairing code first.")
		return
	end
	log("Connecting with code " .. code .. "…")
	startConnection(code)
end)

toggleButton.Click:Connect(function()
	widget.Enabled = not widget.Enabled
end)

-- Resume a previous pairing automatically on Studio restart.
local savedCode = plugin:GetSetting(SETTING_KEY_PAIRING_CODE)
if typeof(savedCode) == "string" and #savedCode > 0 then
	log("Resuming saved pairing code…")
	startConnection(savedCode)
end
