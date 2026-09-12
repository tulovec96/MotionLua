import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@/generated/prisma/client";

export async function POST(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const { commandId, status, result, error } = (await req.json()) as {
    commandId: string;
    status: "ACKED" | "FAILED";
    result?: unknown;
    error?: string;
  };

  const session = await prisma.bridgeSession.findUnique({ where: { pairingCode: code } });
  if (!session) return new Response("Unknown pairing code", { status: 404 });

  const command = await prisma.bridgeCommand.findUnique({ where: { id: commandId } });
  if (!command || command.bridgeSessionId !== session.id) {
    return new Response("Command not found for this session", { status: 404 });
  }

  await prisma.bridgeCommand.update({
    where: { id: commandId },
    data: {
      status,
      result: (status === "FAILED" ? { error } : (result ?? {})) as Prisma.InputJsonValue,
    },
  });

  return Response.json({ ok: true });
}
