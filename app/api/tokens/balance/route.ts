import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { maybeResetCycle } from "@/lib/tokens/cycle";

export async function GET() {
  const sessionUser = await getCurrentUser();
  if (!sessionUser) return new Response("Unauthorized", { status: 401 });

  const dbUser = await prisma.user.findUniqueOrThrow({ where: { id: sessionUser.id } });
  const user = await maybeResetCycle(dbUser);

  return Response.json({
    balance: user.tokenBalance,
    plan: user.plan,
    monthlyAllocation: user.monthlyAllocation,
    monthlyUsed: user.monthlyUsed,
    rolloverTokens: user.rolloverTokens,
    cycleStart: user.cycleStart,
    cycleEnd: user.cycleEnd,
  });
}
