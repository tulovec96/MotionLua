// Single source of truth for plans, token packs, and the credit-unit weights
// used by the reserve/reconcile engine (lib/tokens/reserve.ts, built in a
// later phase). The marketing pricing section and the billing dashboard both
// read from here so they can never drift apart.

export type PlanId = "FREE" | "PRO" | "ULTRA";

export interface PlanDefinition {
  id: PlanId;
  name: string;
  priceMonthlyCents: number;
  priceAnnualCents: number;
  monthlyTokens: number;
  rolloverPct: number;
  /** Anthropic model this plan's chat requests run on. */
  model: string;
  modelLabel: string;
  thinking: "off" | "small" | "adaptive-medium" | "adaptive-high";
  features: string[];
  highlight?: boolean;
}

export const PLAN_DEFINITIONS: PlanDefinition[] = [
  {
    id: "FREE",
    name: "Free",
    priceMonthlyCents: 0,
    priceAnnualCents: 0,
    monthlyTokens: 10_000,
    rolloverPct: 0,
    model: "claude-haiku-4-5",
    modelLabel: "Claude Haiku 4.5",
    thinking: "off",
    features: [
      "10,000 tokens / month",
      "Claude Haiku 4.5",
      "Script generation & GUI editing",
      "Community Discord support",
    ],
  },
  {
    id: "PRO",
    name: "Pro",
    priceMonthlyCents: 2000,
    priceAnnualCents: 2000 * 12 * 0.8,
    monthlyTokens: 500_000,
    rolloverPct: 0.2,
    model: "claude-sonnet-5",
    modelLabel: "Claude Sonnet 5",
    thinking: "adaptive-medium",
    features: [
      "500,000 tokens / month",
      "Claude Sonnet 5 with extended thinking",
      "Marketplace asset import",
      "Live Studio playtests",
      "20% monthly rollover",
      "Priority queue",
    ],
    highlight: true,
  },
  {
    id: "ULTRA",
    name: "Ultra",
    priceMonthlyCents: 5000,
    priceAnnualCents: 5000 * 12 * 0.8,
    monthlyTokens: 2_000_000,
    rolloverPct: 0.3,
    model: "claude-opus-5",
    modelLabel: "Claude Opus 5",
    thinking: "adaptive-high",
    features: [
      "2,000,000 tokens / month",
      "Claude Opus 5 with high-effort thinking",
      "Everything in Pro",
      "30% monthly rollover",
      "Highest priority queue",
    ],
  },
];

export interface TokenPack {
  id: string;
  name: string;
  priceCents: number;
  tokens: number;
  bonusPct: number;
}

export const TOKEN_PACKS: TokenPack[] = [
  { id: "starter", name: "Starter", priceCents: 500, tokens: 50_000, bonusPct: 0 },
  { id: "standard", name: "Standard", priceCents: 2000, tokens: 250_000, bonusPct: 0.1 },
  { id: "pro-pack", name: "Pro Pack", priceCents: 5000, tokens: 700_000, bonusPct: 0.2 },
  { id: "mega-pack", name: "Mega Pack", priceCents: 10000, tokens: 1_600_000, bonusPct: 0.3 },
];

// Internal credit-unit weights — a product-level abstraction independent of
// Anthropic's own $/token pricing. reserve/reconcile compute totalUnits as:
//   inputTokens*INPUT + outputTokens*OUTPUT + reasoningTokens*REASONING + toolCalls*TOOL_CALL
// floored at MIN_RESERVE per request.
export const UNIT_WEIGHTS = {
  INPUT: 1,
  OUTPUT: 2,
  REASONING: 3,
  TOOL_CALL: 500,
} as const;

export const MIN_RESERVE = 1000;

export function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n % 1_000 === 0 ? 0 : 1)}K`;
  return String(n);
}

export function formatPriceCents(cents: number): string {
  if (cents === 0) return "$0";
  const dollars = cents / 100;
  return Number.isInteger(dollars) ? `$${dollars}` : `$${dollars.toFixed(2)}`;
}
