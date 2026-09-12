import { prisma } from "@/lib/db/prisma";
import { MIN_RESERVE } from "@/lib/tokens/pricing";
import { maybeResetCycle } from "@/lib/tokens/cycle";

export class InsufficientTokensError extends Error {
  constructor() {
    super("Insufficient token balance");
    this.name = "InsufficientTokensError";
  }
}

/** Conservative upper-bound reserve locked before streaming starts. */
export function estimateReserve(): number {
  return MIN_RESERVE;
}

/**
 * Runs the lazy monthly-cycle check, then atomically decrements
 * tokenBalance, guarded by the balance check in the same statement
 * (`UPDATE ... WHERE tokenBalance >= amount`) — a single SQL statement is
 * inherently race-safe per row without needing an explicit transaction or
 * row lock.
 */
export async function reserveTokens(userId: string, amount: number): Promise<void> {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  await maybeResetCycle(user);

  const result = await prisma.user.updateMany({
    where: { id: userId, tokenBalance: { gte: amount } },
    data: { tokenBalance: { decrement: amount } },
  });
  if (result.count === 0) {
    throw new InsufficientTokensError();
  }
}

/** Refunds a reservation in full, e.g. when the stream errors before any usage is known. */
export async function releaseReservation(userId: string, amount: number): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { tokenBalance: { increment: amount } },
  });
}
