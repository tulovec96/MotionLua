import { prisma } from "@/lib/db/prisma";

/**
 * Long-poll endpoint the Studio plugin hits every few seconds. Authenticated
 * by the pairing code itself rather than a user session — the plugin has no
 * browser cookies. Transitions PENDING -> CONNECTED on first contact,
 * refreshes the heartbeat, and hands back any queued commands.
 */
export async function POST(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const body = await req.json().catch(() => ({}) as { placeId?: string; placeName?: string });

  const session = await prisma.bridgeSession.findUnique({ where: { pairingCode: code } });
  if (!session || session.status === "EXPIRED") {
    return new Response("Unknown or expired pairing code", { status: 404 });
  }

  await prisma.bridgeSession.update({
    where: { id: session.id },
    data: {
      status: "CONNECTED",
      lastHeartbeatAt: new Date(),
      placeId: body.placeId ?? session.placeId,
      placeName: body.placeName ?? session.placeName,
    },
  });

  const queued = await prisma.bridgeCommand.findMany({
    where: { bridgeSessionId: session.id, status: "QUEUED" },
    orderBy: { createdAt: "asc" },
  });

  if (queued.length > 0) {
    await prisma.bridgeCommand.updateMany({
      where: { id: { in: queued.map((c) => c.id) } },
      data: { status: "SENT" },
    });
  }

  return Response.json({
    status: "connected",
    commands: queued.map((c) => ({ id: c.id, type: c.type, payload: c.payload })),
  });
}
