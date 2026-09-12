import type { InferUITools, UIMessage } from "ai";
import type { toolRegistry } from "@/lib/ai/tool-registry";

/**
 * The chat wire format is the Vercel AI SDK's own UIMessage/UIMessageChunk
 * protocol, not a bespoke event system: tool calls already carry a
 * present/past-tense-able lifecycle (`ToolUIPart.state`:
 * input-streaming -> input-available -> output-available/output-error) and
 * `ReasoningUIPart` already models streaming thinking text. The one thing
 * that protocol doesn't have a slot for is live token-balance updates, so
 * that's the only custom "data-*" part this app defines.
 */
export type ChatDataParts = {
  tokenUsage: {
    balance: number;
    reserved: number;
    used: number;
    model: string;
  };
};

export type ChatTools = InferUITools<typeof toolRegistry>;

export type ChatUIMessage = UIMessage<never, ChatDataParts, ChatTools>;
