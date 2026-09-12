import type { ToolName } from "@/lib/ai/tool-registry";

type LabelFn = (input: unknown, output: unknown) => string;

/** Present-tense (running) / past-tense (done) labels per tool, per the spec's StepCard convention. */
export const TOOL_LABELS: Record<ToolName, { running: string; done: LabelFn }> = {
  get_file_tree: {
    running: "Reading file tree",
    done: (_i, o) => `Read file tree · ${listLength(o, "tree")} items`,
  },
  read_script: {
    running: "Reading script",
    done: (i, o) => `Read ${shortPath(field(i, "path"))} · ${field(o, "lines") ?? "?"} lines`,
  },
  search_instances: {
    running: "Searching instances",
    done: (i, o) => `Searched for "${field(i, "query")}" · ${listLength(o, "results")} results`,
  },
  get_selection: {
    running: "Reading selection",
    done: (_i, o) => `Read selection · ${listLength(o, "selection")} instances`,
  },
  get_properties: {
    running: "Reading properties",
    done: (i) => `Read properties of ${shortPath(field(i, "path"))}`,
  },
  write_script: {
    running: "Editing script",
    done: (i) => `Edited ${shortPath(field(i, "path"))}`,
  },
  create_instance: {
    running: "Creating instance",
    done: (i) => `Created ${field(i, "className")} · ${field(i, "name")}`,
  },
  set_properties: {
    running: "Setting properties",
    done: (i) => `Set properties on ${shortPath(field(i, "path"))}`,
  },
  delete_instance: {
    running: "Deleting instance",
    done: (i) => `Deleted ${shortPath(field(i, "path"))}`,
  },
  execute_luau: {
    running: "Running Luau snippet",
    done: () => "Ran Luau snippet",
  },
  batch_execute: {
    running: "Running batch operation",
    done: (_i, o) => `Ran batch operation · ${field(o, "count") ?? 0} steps`,
  },
  playtest: {
    running: "Controlling playtest",
    done: (i) => (field(i, "action") === "start" ? "Started playtest" : "Stopped playtest"),
  },
  start_playtest: {
    running: "Starting playtest",
    done: () => "Started playtest",
  },
  screenshot: {
    running: "Capturing screenshot",
    done: () => "Captured screenshot",
  },
  capture_viewport: {
    running: "Capturing viewport",
    done: () => "Captured viewport",
  },
  search_marketplace: {
    running: "Searching Marketplace",
    done: (i, o) => `Searched Marketplace for "${field(i, "query")}" · ${listLength(o, "results")} results`,
  },
  get_asset_details: {
    running: "Reading asset details",
    done: (_i, o) => `Read details for ${field(o, "name") ?? "asset"}`,
  },
  import_asset: {
    running: "Importing asset",
    done: (_i, o) => `Imported ${field(o, "name") ?? "asset"}`,
  },
  import_bundle: {
    running: "Importing bundle",
    done: (_i, o) => `Imported bundle · ${field(o, "itemCount") ?? 0} items`,
  },
  search_audio: {
    running: "Searching audio",
    done: (i, o) => `Searched audio for "${field(i, "query")}" · ${listLength(o, "results")} results`,
  },
  get_audio_metadata: {
    running: "Reading audio metadata",
    done: (_i, o) => `Read metadata for ${field(o, "title") ?? "audio"}`,
  },
  import_sound: {
    running: "Importing sound",
    done: () => "Imported sound",
  },
  import_animation: {
    running: "Importing animation",
    done: () => "Imported animation",
  },
  import_mesh: {
    running: "Importing mesh",
    done: () => "Imported mesh",
  },
  import_image: {
    running: "Importing image",
    done: () => "Imported image",
  },
};

/** Safely reads a single field off an unknown tool input/output object. */
function field(value: unknown, key: string): string | number | undefined {
  if (!value || typeof value !== "object") return undefined;
  const v = (value as Record<string, unknown>)[key];
  return typeof v === "string" || typeof v === "number" ? v : undefined;
}

function listLength(value: unknown, key: string): number {
  if (!value || typeof value !== "object") return 0;
  const v = (value as Record<string, unknown>)[key];
  return Array.isArray(v) ? v.length : 0;
}

function shortPath(path?: string | number) {
  if (!path) return "file";
  const parts = String(path).split("/");
  return parts[parts.length - 1];
}
