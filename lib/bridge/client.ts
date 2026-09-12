import { prisma } from "@/lib/db/prisma";
import { isSessionLive } from "@/lib/bridge/pairing";
import { enqueueCommand, waitForResult } from "@/lib/bridge/queue";

export type BridgeCallResult<T> = { ok: true; result: T } | { ok: false };

/**
 * Routes a tool call through a connected Roblox Studio plugin, if the user
 * has one paired and its heartbeat is live. Returns `{ok: false}` whenever
 * there's no usable connection — including a stale/dropped heartbeat — so
 * callers (lib/ai/tool-registry.ts) can fall back to mock results without
 * treating "not paired yet" as an error.
 */
export async function sendBridgeCommand<T = unknown>(
  userId: string,
  type: string,
  payload: unknown
): Promise<BridgeCallResult<T>> {
  const session = await prisma.bridgeSession.findFirst({
    where: { userId, status: "CONNECTED" },
    orderBy: { lastHeartbeatAt: "desc" },
  });
  if (!session || !isSessionLive(session.lastHeartbeatAt)) {
    return { ok: false };
  }

  const command = await enqueueCommand(session.id, type, payload);
  const outcome = await waitForResult(command.id);
  if (!outcome || outcome.status === "FAILED") {
    return { ok: false };
  }
  return { ok: true, result: outcome.result as T };
}
