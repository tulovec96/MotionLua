import { anthropic } from "@ai-sdk/anthropic";
import type { LanguageModelV4 } from "@ai-sdk/provider";
import type { ProviderOptions } from "@ai-sdk/provider-utils";
import { PLAN_DEFINITIONS, type PlanId } from "@/lib/tokens/pricing";

export function hasAnthropicKey(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

function planDefinition(planId: PlanId) {
  return PLAN_DEFINITIONS.find((p) => p.id === planId) ?? PLAN_DEFINITIONS[0];
}

/** Resolves the real Claude model for a plan. Only called when an API key is set. */
export function resolveModel(planId: PlanId): LanguageModelV4 {
  return anthropic(planDefinition(planId).model);
}

/**
 * Anthropic-specific provider options for extended thinking, keyed to plan
 * tier. `display: "summarized"` is required — the default is "omitted"
 * (empty thinking text), which would leave the ThinkingBlock UI empty.
 */
export function thinkingProviderOptions(planId: PlanId): ProviderOptions | undefined {
  const plan = planDefinition(planId);
  switch (plan.thinking) {
    case "off":
      return undefined;
    case "small":
      return { anthropic: { thinking: { type: "enabled", budgetTokens: 2000 } } };
    case "adaptive-medium":
      return {
        anthropic: { thinking: { type: "adaptive", display: "summarized" }, effort: "medium" },
      };
    case "adaptive-high":
      return {
        anthropic: { thinking: { type: "adaptive", display: "summarized" }, effort: "high" },
      };
    default:
      return undefined;
  }
}
