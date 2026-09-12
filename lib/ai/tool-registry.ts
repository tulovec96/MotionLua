import { tool, type Tool } from "ai";
import { z } from "zod";
import { getRequestContext } from "@/lib/ai/request-context";
import { sendBridgeCommand } from "@/lib/bridge/client";
import { searchCatalog, getCatalogItemDetails } from "@/lib/marketplace/catalog-client";
import { mockSearchAudio } from "@/lib/marketplace/mock-catalog";

// The full Roblox Studio tool surface. Every tool tries the paired Studio
// plugin first (via lib/bridge/client.ts, routed through the current
// request's userId from lib/ai/request-context.ts) and falls back to a
// deterministic mock when there's no live connection — so the chat, the
// MCP server (lib/mcp/tools), and the plugin dispatcher all share this one
// name/schema/behavior contract, and the trace UI stays fully demoable
// without a paired plugin.

const path = () => z.string().describe("Instance path, e.g. ServerScriptService/InventoryModule");

/** Tries the bridge; falls back to `mock()` when unpaired, disconnected, or the plugin reports failure. */
async function viaBridgeOrMock<T>(type: string, input: unknown, mock: () => Promise<T> | T): Promise<T> {
  const ctx = getRequestContext();
  if (ctx) {
    const bridged = await sendBridgeCommand<T>(ctx.userId, type, input);
    if (bridged.ok) return bridged.result;
  }
  return mock();
}

// ---------------------------------------------------------------------------
// Read tools
// ---------------------------------------------------------------------------

const get_file_tree = tool({
  description: "List the Script/ModuleScript/Instance tree under a given root path (or the whole place).",
  inputSchema: z.object({ root: z.string().optional().describe("Root path; omit for the whole place") }),
  async execute(input) {
    return viaBridgeOrMock("get_file_tree", input, () => {
      const base = input.root ?? "game";
      return {
        root: base,
        tree: [
          { path: `${base}/ServerScriptService/InventoryModule`, className: "ModuleScript" },
          { path: `${base}/ServerScriptService/PlayerController`, className: "Script" },
          { path: `${base}/ReplicatedStorage/RemoteEvents`, className: "Folder" },
          { path: `${base}/StarterGui/MainHud`, className: "ScreenGui" },
        ],
      };
    });
  },
});

const read_script = tool({
  description: "Read the full source of a Script or ModuleScript.",
  inputSchema: z.object({ path: path() }),
  async execute(input) {
    return viaBridgeOrMock("read_script", input, () => {
      const content = MOCK_FILES[input.path] ?? MOCK_FILES.default;
      return { path: input.path, content, lines: content.split("\n").length };
    });
  },
});

const search_instances = tool({
  description: "Search the place hierarchy for instances by name, class, or both.",
  inputSchema: z.object({
    query: z.string(),
    className: z.string().optional(),
  }),
  async execute(input) {
    return viaBridgeOrMock("search_instances", input, () => ({
      query: input.query,
      results: [
        { path: `game/Workspace/${input.query}`, className: input.className ?? "Model" },
        { path: `game/ServerScriptService/${input.query}Handler`, className: "Script" },
      ],
    }));
  },
});

const get_selection = tool({
  description: "Get the instances currently selected in Roblox Studio.",
  inputSchema: z.object({}),
  async execute(input) {
    return viaBridgeOrMock("get_selection", input, () => ({
      selection: [{ path: "game/Workspace/Baseplate", className: "Part" }],
    }));
  },
});

const get_properties = tool({
  description: "Read the properties of a single instance.",
  inputSchema: z.object({ path: path() }),
  async execute(input) {
    return viaBridgeOrMock("get_properties", input, () => ({
      path: input.path,
      properties: { Name: input.path.split("/").pop() ?? input.path, Anchored: "true", CanCollide: "true" },
    }));
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
  async execute(input) {
    return viaBridgeOrMock("write_script", input, () => {
      const before = MOCK_FILES[input.path] ?? "";
      return { path: input.path, before, after: input.content, summary: input.summary };
    });
  },
});

const create_instance = tool({
  description: "Create a new Instance (Part, Script, GUI element, etc.) under a parent.",
  inputSchema: z.object({
    className: z.string(),
    parent: path(),
    name: z.string(),
  }),
  async execute(input) {
    return viaBridgeOrMock("create_instance", input, () => ({
      path: `${input.parent}/${input.name}`,
      className: input.className,
    }));
  },
});

const set_properties = tool({
  description: "Set one or more properties on an existing instance.",
  inputSchema: z.object({
    path: path(),
    properties: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])),
  }),
  async execute(input) {
    return viaBridgeOrMock("set_properties", input, () => {
      const before: Record<string, unknown> = {};
      for (const key of Object.keys(input.properties)) before[key] = "<previous value>";
      return { path: input.path, before, after: input.properties };
    });
  },
});

const delete_instance = tool({
  description: "Delete an instance. State what you're about to delete in your text before calling this.",
  inputSchema: z.object({ path: path() }),
  async execute(input) {
    return viaBridgeOrMock("delete_instance", input, () => ({ path: input.path, deleted: true }));
  },
});

const execute_luau = tool({
  description: "Run an arbitrary Luau snippet in Studio's command bar context (for quick inspection, not persisted).",
  inputSchema: z.object({ code: z.string() }),
  async execute(input) {
    return viaBridgeOrMock("execute_luau", input, () => ({
      code: input.code,
      output: "-- executed (mock, no plugin paired) --\nnil",
    }));
  },
});

const batch_execute = tool({
  description: "Run multiple write operations as a single atomic batch (useful for coordinated multi-file edits).",
  inputSchema: z.object({
    operations: z.array(z.object({ type: z.string(), path: path() })),
  }),
  async execute(input) {
    return viaBridgeOrMock("batch_execute", input, () => ({
      count: input.operations.length,
      paths: input.operations.map((o) => o.path),
    }));
  },
});

// ---------------------------------------------------------------------------
// Playtest tools
// ---------------------------------------------------------------------------

const playtest = tool({
  description: "Start or stop a Studio playtest session (Solo mode).",
  inputSchema: z.object({ action: z.enum(["start", "stop"]) }),
  async execute(input) {
    return viaBridgeOrMock("playtest", input, () => ({
      action: input.action,
      status: input.action === "start" ? "running" : "stopped",
      console: input.action === "start" ? ["[Info] Playtest started (mock, no plugin paired)", "[Info] 0 errors"] : [],
    }));
  },
});

const start_playtest = tool({
  description: "Start a Studio playtest session (Solo mode). Equivalent to playtest({action: 'start'}).",
  inputSchema: z.object({}),
  async execute(input) {
    return viaBridgeOrMock("start_playtest", input, () => ({
      status: "running",
      console: ["[Info] Playtest started (mock, no plugin paired)", "[Info] 0 errors"],
    }));
  },
});

const screenshot = tool({
  description: "Capture a screenshot of the current Studio viewport.",
  inputSchema: z.object({}),
  async execute(input) {
    return viaBridgeOrMock("screenshot", input, () => ({
      capturedAt: new Date().toISOString(),
      note: "Screenshot capture requires a paired plugin.",
    }));
  },
});

const capture_viewport = tool({
  description: "Capture the current 3D viewport for visual review.",
  inputSchema: z.object({}),
  async execute(input) {
    return viaBridgeOrMock("capture_viewport", input, () => ({
      capturedAt: new Date().toISOString(),
      note: "Viewport capture requires a paired plugin.",
    }));
  },
});

// ---------------------------------------------------------------------------
// Marketplace & asset tools
// ---------------------------------------------------------------------------
// Search/details hit Roblox's real public Catalog API directly (no plugin
// needed — see lib/marketplace/catalog-client.ts). Import tools actually
// place assets into the Studio session, so they always require the bridge;
// audio search has no public REST equivalent (Roblox only exposes it via
// AssetService:SearchAudioAsync inside Studio), so it's bridge-or-mock too.

const search_marketplace = tool({
  description: "Search the Roblox Creator Store catalog for models, bundles, or other assets.",
  inputSchema: z.object({
    query: z.string(),
    assetType: z.string().optional().describe("e.g. Model, Bundle, Gear"),
  }),
  async execute({ query, assetType }) {
    const results = await searchCatalog(query, assetType ?? "Model");
    return { query, results };
  },
});

const get_asset_details = tool({
  description: "Get details (name, creator, description) for a specific marketplace asset id.",
  inputSchema: z.object({ assetId: z.string() }),
  async execute({ assetId }) {
    return getCatalogItemDetails(assetId);
  },
});

const import_asset = tool({
  description: "Import a marketplace model or bundle into the place. Confirm with the user before calling this.",
  inputSchema: z.object({ assetId: z.string(), name: z.string().optional() }),
  async execute(input) {
    return viaBridgeOrMock("import_asset", input, () => ({
      id: input.assetId,
      name: input.name ?? `Asset_${input.assetId}`,
      imported: false,
      note: "Import requires a paired plugin — this asset was located but not placed.",
    }));
  },
});

const import_bundle = tool({
  description: "Import a marketplace bundle (multiple related assets) into the place.",
  inputSchema: z.object({ bundleId: z.string() }),
  async execute(input) {
    return viaBridgeOrMock("import_bundle", input, () => ({
      id: input.bundleId,
      itemCount: 0,
      imported: false,
      note: "Import requires a paired plugin.",
    }));
  },
});

const search_audio = tool({
  description: "Search Roblox's audio catalog (AssetService:SearchAudioAsync) for sound effects or music.",
  inputSchema: z.object({ query: z.string() }),
  async execute(input) {
    return viaBridgeOrMock("search_audio", input, () => ({
      query: input.query,
      results: mockSearchAudio(input.query),
    }));
  },
});

const get_audio_metadata = tool({
  description: "Get title, artist, and duration for a specific audio asset id.",
  inputSchema: z.object({ assetId: z.string() }),
  async execute(input) {
    return viaBridgeOrMock("get_audio_metadata", input, () => ({
      id: input.assetId,
      title: "Sample Sound",
      artist: "SFX Library",
      duration: 1.8,
    }));
  },
});

const import_sound = tool({
  description: "Import a sound asset as a Sound instance (SoundId = rbxassetid://<id>).",
  inputSchema: z.object({ assetId: z.string(), parent: path().optional() }),
  async execute(input) {
    return viaBridgeOrMock("import_sound", input, () => ({
      id: input.assetId,
      soundId: `rbxassetid://${input.assetId}`,
      parent: input.parent ?? "game/Workspace",
      imported: false,
      note: "Import requires a paired plugin.",
    }));
  },
});

const import_animation = tool({
  description: "Import an animation asset into the place.",
  inputSchema: z.object({ assetId: z.string() }),
  async execute(input) {
    return viaBridgeOrMock("import_animation", input, () => ({
      id: input.assetId,
      animationId: `rbxassetid://${input.assetId}`,
      imported: false,
      note: "Import requires a paired plugin.",
    }));
  },
});

const import_mesh = tool({
  description: "Import a mesh asset into the place.",
  inputSchema: z.object({ assetId: z.string() }),
  async execute(input) {
    return viaBridgeOrMock("import_mesh", input, () => ({
      id: input.assetId,
      meshId: `rbxassetid://${input.assetId}`,
      imported: false,
      note: "Import requires a paired plugin.",
    }));
  },
});

const import_image = tool({
  description: "Import an image/decal asset into the place.",
  inputSchema: z.object({ assetId: z.string() }),
  async execute(input) {
    return viaBridgeOrMock("import_image", input, () => ({
      id: input.assetId,
      imageId: `rbxassetid://${input.assetId}`,
      imported: false,
      note: "Import requires a paired plugin.",
    }));
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
