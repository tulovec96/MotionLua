import { addMonths } from "date-fns";
import { prisma } from "@/lib/db/prisma";
import type { User } from "@/generated/prisma/client";
import { PLAN_DEFINITIONS, type PlanId } from "@/lib/tokens/pricing";

/**
 * Lazily resets a user's monthly cycle on the first request after it ends —
 * there's no cron job; every call to reserveTokens() checks this first.
 *
 * The schema pools monthly allocation, rollover, and pay-as-you-go top-ups
 * into one `tokenBalance` field, so a reset can't simply "know" which
 * remaining tokens came from a top-up vs. the monthly grant. We approximate:
 * whatever's left in tokenBalance beyond the unused monthly allocation is
 * treated as top-up tokens (which never expire and carry over in full); the
 * unused monthly portion itself only rolls over up to the plan's
 * rolloverPct, then a fresh monthlyAllocation is granted.
 */
export async function maybeResetCycle(user: User): Promise<User> {
  const now = new Date();

  if (!user.cycleEnd) {
    return prisma.user.update({
      where: { id: user.id },
      data: { cycleEnd: addMonths(user.cycleStart, 1) },
    });
  }

  if (now <= user.cycleEnd) {
    return user;
  }

  const plan = PLAN_DEFINITIONS.find((p) => p.id === (user.plan as PlanId)) ?? PLAN_DEFINITIONS[0];
  const unusedMonthly = Math.max(user.monthlyAllocation - user.monthlyUsed, 0);
  const rollover = Math.floor(unusedMonthly * plan.rolloverPct);
  const topupRemainder = Math.max(user.tokenBalance - unusedMonthly, 0);
  const newBalance = topupRemainder + rollover + plan.monthlyTokens;

  return prisma.user.update({
    where: { id: user.id },
    data: {
      tokenBalance: newBalance,
      monthlyAllocation: plan.monthlyTokens,
      monthlyUsed: 0,
      rolloverTokens: rollover,
      cycleStart: now,
      cycleEnd: addMonths(now, 1),
    },
  });
}
