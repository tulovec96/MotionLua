import type { PlanId } from "@/lib/tokens/pricing";

const PLAN_PRICE_ENV: Record<Exclude<PlanId, "FREE">, string | undefined> = {
  PRO: process.env.STRIPE_PRICE_PRO,
  ULTRA: process.env.STRIPE_PRICE_ULTRA,
};

const PACK_PRICE_ENV: Record<string, string | undefined> = {
  starter: process.env.STRIPE_PRICE_PACK_STARTER,
  standard: process.env.STRIPE_PRICE_PACK_STANDARD,
  "pro-pack": process.env.STRIPE_PRICE_PACK_PRO,
  "mega-pack": process.env.STRIPE_PRICE_PACK_MEGA,
};

export function planPriceId(planId: Exclude<PlanId, "FREE">): string | undefined {
  return PLAN_PRICE_ENV[planId];
}

export function packPriceId(packId: string): string | undefined {
  return PACK_PRICE_ENV[packId];
}
