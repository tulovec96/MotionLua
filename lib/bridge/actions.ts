"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { generatePairingCode } from "@/lib/bridge/pairing";

export async function createPairingCode() {
  const user = await requireUser("/settings/plugin");

  await prisma.bridgeSession.updateMany({
    where: { userId: user.id, status: "PENDING" },
    data: { status: "EXPIRED" },
  });

  let pairingCode: string | undefined;
  for (let attempt = 0; attempt < 5 && !pairingCode; attempt++) {
    try {
      const session = await prisma.bridgeSession.create({
        data: { userId: user.id, pairingCode: generatePairingCode(), status: "PENDING" },
      });
      pairingCode = session.pairingCode;
    } catch {
      // pairing code collision — retry
    }
  }

  revalidatePath("/settings/plugin");
  return pairingCode;
}
