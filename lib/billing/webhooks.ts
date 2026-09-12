import type Stripe from "stripe";
import { addMonths } from "date-fns";
import { prisma } from "@/lib/db/prisma";
import { PLAN_DEFINITIONS, TOKEN_PACKS, type PlanId } from "@/lib/tokens/pricing";

/**
 * Stripe webhook event handling. Only checkout.session.completed is fully
 * fleshed out (the happy path every purchase goes through); subscription
 * lifecycle events keep the plan field in sync but don't attempt proration
 * edge cases — reasonable for a scaffold, worth hardening before real money
 * moves through it.
 */
export async function handleStripeEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      await handleCheckoutCompleted(session);
      break;
    }
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const userId = sub.metadata?.userId;
      if (userId) {
        await prisma.user.update({
          where: { id: userId },
          data: { plan: "FREE", monthlyAllocation: PLAN_DEFINITIONS[0].monthlyTokens },
        });
      }
      break;
    }
    default:
      break;
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const { userId, type, planId, packId } = session.metadata ?? {};
  if (!userId) return;

  const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;

  if (type === "plan" && planId) {
    const plan = PLAN_DEFINITIONS.find((p) => p.id === (planId as PlanId));
    if (!plan) return;

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: {
          plan: plan.id,
          tokenBalance: { increment: plan.monthlyTokens },
          monthlyAllocation: plan.monthlyTokens,
          monthlyUsed: 0,
          cycleStart: new Date(),
          cycleEnd: addMonths(new Date(), 1),
          stripeCustomerId: customerId ?? undefined,
        },
      }),
      prisma.transaction.create({
        data: {
          userId,
          type: "SUBSCRIPTION",
          amountCents: session.amount_total ?? plan.priceMonthlyCents,
          tokensGranted: plan.monthlyTokens,
          stripePaymentId: session.id,
          status: "COMPLETED",
        },
      }),
    ]);
  }

  if (type === "pack" && packId) {
    const pack = TOKEN_PACKS.find((p) => p.id === packId);
    if (!pack) return;
    const tokensGranted = Math.round(pack.tokens * (1 + pack.bonusPct));

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: {
          tokenBalance: { increment: tokensGranted },
          stripeCustomerId: customerId ?? undefined,
        },
      }),
      prisma.transaction.create({
        data: {
          userId,
          type: "TOKEN_PACK",
          amountCents: session.amount_total ?? pack.priceCents,
          tokensGranted,
          stripePaymentId: session.id,
          status: "COMPLETED",
        },
      }),
    ]);
  }
}

/** Applies a mock (no-Stripe) purchase directly — see lib/billing/stripe.ts's MockBillingClient. */
export async function applyMockPurchase(params: {
  userId: string;
  type: "plan" | "pack";
  planId?: string;
  packId?: string;
}): Promise<void> {
  const { userId, type, planId, packId } = params;

  if (type === "plan" && planId) {
    const plan = PLAN_DEFINITIONS.find((p) => p.id === (planId as PlanId));
    if (!plan) return;
    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: {
          plan: plan.id,
          tokenBalance: { increment: plan.monthlyTokens },
          monthlyAllocation: plan.monthlyTokens,
          monthlyUsed: 0,
          cycleStart: new Date(),
          cycleEnd: addMonths(new Date(), 1),
        },
      }),
      prisma.transaction.create({
        data: {
          userId,
          type: "SUBSCRIPTION",
          amountCents: plan.priceMonthlyCents,
          tokensGranted: plan.monthlyTokens,
          status: "COMPLETED",
        },
      }),
    ]);
  }

  if (type === "pack" && packId) {
    const pack = TOKEN_PACKS.find((p) => p.id === packId);
    if (!pack) return;
    const tokensGranted = Math.round(pack.tokens * (1 + pack.bonusPct));
    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { tokenBalance: { increment: tokensGranted } },
      }),
      prisma.transaction.create({
        data: {
          userId,
          type: "TOKEN_PACK",
          amountCents: pack.priceCents,
          tokensGranted,
          status: "COMPLETED",
        },
      }),
    ]);
  }
}
