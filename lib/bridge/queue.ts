import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@/generated/prisma/client";
import type { BridgeCommandOutcome } from "@/lib/bridge/types";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function enqueueCommand(bridgeSessionId: string, type: string, payload: unknown) {
  return prisma.bridgeCommand.create({
    data: {
      bridgeSessionId,
      type,
      payload: (payload ?? {}) as Prisma.InputJsonValue,
      status: "QUEUED",
    },
  });
}

/** Polls the DB for a command's terminal state, bounded by timeoutMs. */
export async function waitForResult(
  commandId: string,
  timeoutMs = 15_000
): Promise<BridgeCommandOutcome | null> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const command = await prisma.bridgeCommand.findUnique({ where: { id: commandId } });
    if (command?.status === "ACKED" || command?.status === "FAILED") {
      return { status: command.status, result: command.result ?? undefined };
    }
    await sleep(400);
  }
  return null;
}
