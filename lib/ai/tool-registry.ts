import { tool, type Tool } from "ai";
import { z } from "zod";

// The full Roblox Studio tool surface. Every execute() here is a MOCK for
// this phase — deterministic, dependency-free fixtures — so the chat UI's
// streaming trace can be built and demoed without a paired Studio plugin. A
// later phase swaps these bodies for real calls through lib/bridge/client.ts
// while keeping this exact name/schema contract, so the in-app chat, the MCP
// server, and the plugin dispatcher never diverge on what a tool call means.

const path = () => z.string().describe("Instance path, e.g. ServerScriptService/InventoryModule");

// ---------------------------------------------------------------------------
// Read tools
// ---------------------------------------------------------------------------

const get_file_tree = tool({
  description: "List the Script/ModuleScript/Instance tree under a given root path (or the whole place).",
  inputSchema: z.object({ root: z.string().optional().describe("Root path; omit for the whole place") }),
  async execute({ root }) {
    const base = root ?? "game";
    return {
      root: base,
      tree: [
        { path: `${base}/ServerScriptService/InventoryModule`, className: "ModuleScript" },
        { path: `${base}/ServerScriptService/PlayerController`, className: "Script" },
        { path: `${base}/ReplicatedStorage/RemoteEvents`, className: "Folder" },
        { path: `${base}/StarterGui/MainHud`, className: "ScreenGui" },
      ],
    };
  },
});

const read_script = tool({
  description: "Read the full source of a Script or ModuleScript.",
  inputSchema: z.object({ path: path() }),
  async execute({ path }) {
    const content = MOCK_FILES[path] ?? MOCK_FILES.default;
    return { path, content, lines: content.split("\n").length };
  },
});

const search_instances = tool({
  description: "Search the place hierarchy for instances by name, class, or both.",
  inputSchema: z.object({
    query: z.string(),
    className: z.string().optional(),
  }),
  async execute({ query, className }) {
    return {
      query,
      results: [
        { path: `game/Workspace/${query}`, className: className ?? "Model" },
        { path: `game/ServerScriptService/${query}Handler`, className: "Script" },
      ],
    };
  },
});

const get_selection = tool({
  description: "Get the instances currently selected in Roblox Studio.",
  inputSchema: z.object({}),
  async execute() {
    return { selection: [{ path: "game/Workspace/Baseplate", className: "Part" }] };
  },
});

const get_properties = tool({
  description: "Read the properties of a single instance.",
  inputSchema: z.object({ path: path() }),
  async execute({ path }) {
    return {
      path,
      properties: { Name: path.split("/").pop() ?? path, Anchored: "true", CanCollide: "true" },
    };
  },
});

// ---------------------------------------------------------------------------
// Write tools
// ---------------------------------------------------------------------------

const write_script = tool({
  description:
    "Create or overwrite the source of a Script or ModuleScript. Always narrate what's changing before calling this.",
  inputSchema: z.object({
    path: path(),
    content: z.string().describe("Full new file content"),
    summary: z.string().describe("One-line, past-tense description of the change"),
  }),
  async execute({ path, content, summary }) {
    const before = MOCK_FILES[path] ?? "";
    return { path, before, after: content, summary };
  },
});

const create_instance = tool({
  description: "Create a new Instance (Part, Script, GUI element, etc.) under a parent.",
  inputSchema: z.object({
    className: z.string(),
    parent: path(),
    name: z.string(),
  }),
  async execute({ className, parent, name }) {
    return { path: `${parent}/${name}`, className };
  },
});

const set_properties = tool({
  description: "Set one or more properties on an existing instance.",
  inputSchema: z.object({
    path: path(),
    properties: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])),
  }),
  async execute({ path, properties }) {
    const before: Record<string, unknown> = {};
    for (const key of Object.keys(properties)) before[key] = "<previous value>";
    return { path, before, after: properties };
  },
});

const delete_instance = tool({
  description: "Delete an instance. State what you're about to delete in your text before calling this.",
  inputSchema: z.object({ path: path() }),
  async execute({ path }) {
    return { path, deleted: true };
  },
});

const execute_luau = tool({
  description: "Run an arbitrary Luau snippet in Studio's command bar context (for quick inspection, not persisted).",
  inputSchema: z.object({ code: z.string() }),
  async execute({ code }) {
    return { code, output: "-- executed (mock) --\nnil" };
  },
});

const batch_execute = tool({
  description: "Run multiple write operations as a single atomic batch (useful for coordinated multi-file edits).",
  inputSchema: z.object({
    operations: z.array(z.object({ type: z.string(), path: path() })),
  }),
  async execute({ operations }) {
    return { count: operations.length, paths: operations.map((o) => o.path) };
  },
});

// ---------------------------------------------------------------------------
// Playtest tools
// ---------------------------------------------------------------------------

const playtest = tool({
  description: "Start or stop a Studio playtest session (Solo mode).",
  inputSchema: z.object({ action: z.enum(["start", "stop"]) }),
  async execute({ action }) {
    return {
      action,
      status: action === "start" ? "running" : "stopped",
      console: action === "start" ? ["[Info] Playtest started", "[Info] 0 errors"] : [],
    };
  },
});

const start_playtest = tool({
  description: "Start a Studio playtest session (Solo mode). Equivalent to playtest({action: 'start'}).",
  inputSchema: z.object({}),
  async execute() {
    return { status: "running", console: ["[Info] Playtest started", "[Info] 0 errors"] };
  },
});

const screenshot = tool({
  description: "Capture a screenshot of the current Studio viewport.",
  inputSchema: z.object({}),
  async execute() {
    return { capturedAt: new Date().toISOString(), note: "Screenshot capture requires a paired plugin." };
  },
});

const capture_viewport = tool({
  description: "Capture the current 3D viewport for visual review.",
  inputSchema: z.object({}),
  async execute() {
    return { capturedAt: new Date().toISOString(), note: "Viewport capture requires a paired plugin." };
  },
});

// ---------------------------------------------------------------------------
// Marketplace & asset tools
// ---------------------------------------------------------------------------

const search_marketplace = tool({
  description: "Search the Roblox Creator Store catalog for models, bundles, or other assets.",
  inputSchema: z.object({
    query: z.string(),
    assetType: z.string().optional().describe("e.g. Model, Bundle, Gear"),
  }),
  async execute({ query, assetType }) {
    return {
      query,
      results: mockCatalogResults(query, assetType ?? "Model"),
    };
  },
});

const get_asset_details = tool({
  description: "Get details (name, creator, description) for a specific marketplace asset id.",
  inputSchema: z.object({ assetId: z.string() }),
  async execute({ assetId }) {
    return { id: assetId, name: "Sample Asset", creator: "CommunityCreator", description: "A community-made asset." };
  },
});

const import_asset = tool({
  description: "Import a marketplace model or bundle into the place. Confirm with the user before calling this.",
  inputSchema: z.object({ assetId: z.string(), name: z.string().optional() }),
  async execute({ assetId, name }) {
    return { id: assetId, name: name ?? `Asset_${assetId}`, imported: true };
  },
});

const import_bundle = tool({
  description: "Import a marketplace bundle (multiple related assets) into the place.",
  inputSchema: z.object({ bundleId: z.string() }),
  async execute({ bundleId }) {
    return { id: bundleId, itemCount: 3, imported: true };
  },
});

const search_audio = tool({
  description: "Search Roblox's audio catalog (AssetService:SearchAudioAsync) for sound effects or music.",
  inputSchema: z.object({ query: z.string() }),
  async execute({ query }) {
    return {
      query,
      results: [
        { id: "9012345678", title: `${query} Hit 01`, artist: "SFX Library", duration: 1.4 },
        { id: "9012345679", title: `${query} Hit 02`, artist: "SFX Library", duration: 2.1 },
      ],
    };
  },
});

const get_audio_metadata = tool({
  description: "Get title, artist, and duration for a specific audio asset id.",
  inputSchema: z.object({ assetId: z.string() }),
  async execute({ assetId }) {
    return { id: assetId, title: "Sample Sound", artist: "SFX Library", duration: 1.8 };
  },
});

const import_sound = tool({
  description: "Import a sound asset as a Sound instance (SoundId = rbxassetid://<id>).",
  inputSchema: z.object({ assetId: z.string(), parent: path().optional() }),
  async execute({ assetId, parent }) {
    return { id: assetId, soundId: `rbxassetid://${assetId}`, parent: parent ?? "game/Workspace" };
  },
});

const import_animation = tool({
  description: "Import an animation asset into the place.",
  inputSchema: z.object({ assetId: z.string() }),
  async execute({ assetId }) {
    return { id: assetId, animationId: `rbxassetid://${assetId}` };
  },
});

const import_mesh = tool({
  description: "Import a mesh asset into the place.",
  inputSchema: z.object({ assetId: z.string() }),
  async execute({ assetId }) {
    return { id: assetId, meshId: `rbxassetid://${assetId}` };
  },
});

const import_image = tool({
  description: "Import an image/decal asset into the place.",
  inputSchema: z.object({ assetId: z.string() }),
  async execute({ assetId }) {
    return { id: assetId, imageId: `rbxassetid://${assetId}` };
  },
});

export const toolRegistry = {
  get_file_tree,
  read_script,
  search_instances,
  get_selection,
  get_properties,
  write_script,
  create_instance,
  set_properties,
  delete_instance,
  execute_luau,
  batch_execute,
  playtest,
  start_playtest,
  screenshot,
  capture_viewport,
  search_marketplace,
  get_asset_details,
  import_asset,
  import_bundle,
  search_audio,
  get_audio_metadata,
  import_sound,
  import_animation,
  import_mesh,
  import_image,
} satisfies Record<string, Tool>;

export type ToolName = keyof typeof toolRegistry;

const MOCK_FILES: Record<string, string> = {
  default: [
    "--!strict",
    "local Players = game:GetService(\"Players\")",
    "",
    "local PlayerController = {}",
    "",
    "return PlayerController",
    "",
  ].join("\n"),
};

function mockCatalogResults(query: string, assetType: string) {
  return [
    { id: "7011234561", name: `${query} Pack A`, creator: "StudioForge", assetType },
    { id: "7011234562", name: `${query} Pack B`, creator: "VoxelWorks", assetType },
    { id: "7011234563", name: `${query} Deluxe`, creator: "PrismAssets", assetType },
  ];
}
