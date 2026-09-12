import { prisma } from "@/lib/db/prisma";
import { UNIT_WEIGHTS } from "@/lib/tokens/pricing";

export interface UsageCounts {
  inputTokens: number;
  outputTokens: number;
  reasoningTokens: number;
  toolCalls: number;
}

export function computeUnits(usage: UsageCounts): number {
  return (
    usage.inputTokens * UNIT_WEIGHTS.INPUT +
    usage.outputTokens * UNIT_WEIGHTS.OUTPUT +
    usage.reasoningTokens * UNIT_WEIGHTS.REASONING +
    usage.toolCalls * UNIT_WEIGHTS.TOOL_CALL
  );
}

/**
 * Reconciles a prior reservation against actual usage: credits back the
 * surplus (or debits the shortfall — an allowed, logged negative float, not
 * blocked) and records the UsageEvent. Always call this once per request,
 * even on error paths, so a failed generation doesn't leave tokens
 * permanently locked out of the balance.
 */
export async function reconcileUsage(params: {
  userId: string;
  sessionId?: string;
  model: string;
  reservedUnits: number;
  usage: UsageCounts;
}): Promise<number> {
  const { userId, sessionId, model, reservedUnits, usage } = params;
  const actualUnits = computeUnits(usage);
  const delta = actualUnits - reservedUnits;

  const [user] = await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: {
        tokenBalance: { decrement: delta },
        monthlyUsed: { increment: actualUnits },
      },
    }),
    prisma.usageEvent.create({
      data: {
        userId,
        sessionId,
        model,
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
        reasoningTokens: usage.reasoningTokens,
        toolCalls: usage.toolCalls,
        totalUnits: actualUnits,
      },
    }),
  ]);

  return user.tokenBalance;
}
