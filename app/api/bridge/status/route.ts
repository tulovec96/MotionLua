import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { isSessionLive } from "@/lib/bridge/pairing";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const session = await prisma.bridgeSession.findFirst({
    where: { userId: user.id, status: { in: ["PENDING", "CONNECTED"] } },
    orderBy: { createdAt: "desc" },
  });

  if (!session) return Response.json({ paired: false });

  const live = session.status === "CONNECTED" && isSessionLive(session.lastHeartbeatAt);
  return Response.json({
    paired: true,
    pairingCode: session.pairingCode,
    status: live ? "connected" : session.status === "CONNECTED" ? "disconnected" : "pending",
    placeName: session.placeName,
  });
}
