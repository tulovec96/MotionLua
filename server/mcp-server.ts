#!/usr/bin/env node
import "dotenv/config";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import type { z } from "zod";
import { toolRegistry } from "@/lib/ai/tool-registry";
import { requestContext } from "@/lib/ai/request-context";

/**
 * Standalone MCP server (stdio transport) exposing the exact same tool
 * surface as the in-app chat (lib/ai/tool-registry.ts) — so a tool call
 * from Claude Desktop, Claude Code, or any other MCP client behaves
 * identically to one made from RobloAI's own chat UI.
 *
 * Bridge routing (lib/bridge/client.ts) needs a userId to look up which
 * Studio plugin is paired. In this standalone process there's no logged-in
 * web session to read one from, so ROBLOAI_USER_ID opts a local run into
 * bridge-backed tool calls against that account's paired plugin; without
 * it, every tool call falls back to the same mock fixtures the chat UI
 * uses when nothing is paired.
 *
 * Run with: npm run mcp:server
 */
const server = new McpServer({ name: "robloai", version: "0.1.0" });

for (const [name, tool] of Object.entries(toolRegistry)) {
  const execute = tool.execute;
  if (!execute) continue;
  const shape = (tool.inputSchema as z.ZodObject<z.ZodRawShape>).shape;
  const description = typeof tool.description === "string" ? tool.description : undefined;

  server.registerTool(
    name,
    { description, inputSchema: shape },
    async (args) => {
      const userId = process.env.ROBLOAI_USER_ID;
      const run = async () => {
        // Iterating a heterogeneous Record<string, Tool> erases each tool's
        // specific input type; `args` is already validated against this
        // exact tool's zod shape by the MCP SDK at the call site above.
        const output = await execute(args as never, {
          toolCallId: `mcp-${Date.now()}`,
          messages: [],
        } as never);
        return {
          content: [{ type: "text" as const, text: JSON.stringify(output, null, 2) }],
        };
      };
      return userId ? requestContext.run({ userId }, run) : run();
    }
  );
}

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`[mcp] RobloAI MCP server ready — ${Object.keys(toolRegistry).length} tools registered.`);
}

main().catch((error) => {
  console.error("[mcp] fatal error", error);
  process.exit(1);
});
