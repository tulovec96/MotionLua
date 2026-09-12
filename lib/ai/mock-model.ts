import type { UIMessageStreamWriter } from "ai";
import type { ChatUIMessage } from "@/lib/ai/trace";
import type { UsageCounts } from "@/lib/tokens/reconcile";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function streamTextPart(
  writer: UIMessageStreamWriter<ChatUIMessage>,
  id: string,
  text: string
) {
  writer.write({ type: "text-start", id });
  for (const word of text.split(" ")) {
    writer.write({ type: "text-delta", id, delta: word + " " });
    await sleep(15);
  }
  writer.write({ type: "text-end", id });
}

/**
 * Scripted multi-step trace used whenever ANTHROPIC_API_KEY is unset, so the
 * streaming step-card / thinking-block / diff UI is fully demoable without a
 * live model. Deliberately narrates and calls the *same* mocked tools from
 * lib/ai/tool-registry.ts, so this path exercises identical UI code to the
 * real-model path.
 */
export async function runMockTrace(
  writer: UIMessageStreamWriter<ChatUIMessage>,
  userText: string
): Promise<UsageCounts> {
  writer.write({ type: "start" });
  writer.write({ type: "start-step" });

  writer.write({ type: "reasoning-start", id: "r1" });
  const thinking =
    "The user wants a change to PlayerController. I should read the current " +
    "file first, then write the updated version and explain the diff.";
  for (const word of thinking.split(" ")) {
    writer.write({ type: "reasoning-delta", id: "r1", delta: word + " " });
    await sleep(10);
  }
  writer.write({ type: "reasoning-end", id: "r1" });

  await streamTextPart(writer, "t1", "Let me check what's in PlayerController.luau.");

  writer.write({
    type: "tool-input-available",
    toolCallId: "call_1",
    toolName: "read_script",
    input: { path: "ServerScriptService/PlayerController" },
  });
  await sleep(300);
  writer.write({
    type: "tool-output-available",
    toolCallId: "call_1",
    output: {
      path: "ServerScriptService/PlayerController",
      content: "--!strict\nlocal PlayerController = {}\n\nreturn PlayerController\n",
      lines: 4,
    },
  });

  await streamTextPart(writer, "t2", `I'll add that now: "${truncate(userText, 60)}".`);

  const before = "--!strict\nlocal PlayerController = {}\n\nreturn PlayerController\n";
  const after =
    "--!strict\nlocal PlayerController = {}\n\nlocal JUMP_COOLDOWN = 1.5\nlocal lastJumpAt = 0\n\nreturn PlayerController\n";

  writer.write({
    type: "tool-input-available",
    toolCallId: "call_2",
    toolName: "write_script",
    input: {
      path: "ServerScriptService/PlayerController",
      content: after,
      summary: "Added jump cooldown state",
    },
  });
  await sleep(400);
  writer.write({
    type: "tool-output-available",
    toolCallId: "call_2",
    output: { path: "ServerScriptService/PlayerController", before, after, summary: "Added jump cooldown state" },
  });

  await streamTextPart(writer, "t3", "Done — the cooldown state is in place and ready to wire up to input.");

  writer.write({ type: "finish-step" });
  writer.write({ type: "finish" });

  return { inputTokens: 420, outputTokens: 180, reasoningTokens: 60, toolCalls: 2 };
}

function truncate(text: string, max: number) {
  return text.length > max ? text.slice(0, max - 1) + "…" : text;
}
