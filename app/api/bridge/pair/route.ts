import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { generatePairingCode } from "@/lib/bridge/pairing";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  // Expire any prior pending codes so only the newest one is valid.
  await prisma.bridgeSession.updateMany({
    where: { userId: user.id, status: "PENDING" },
    data: { status: "EXPIRED" },
  });

  let session;
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      session = await prisma.bridgeSession.create({
        data: { userId: user.id, pairingCode: generatePairingCode(), status: "PENDING" },
      });
      break;
    } catch {
      // Unique constraint collision on pairingCode (unlikely) — retry with a new code.
    }
  }
  if (!session) return new Response("Could not generate a pairing code", { status: 500 });

  return Response.json({ pairingCode: session.pairingCode });
}
