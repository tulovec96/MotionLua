import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { ChatShell } from "@/components/chat/chat-shell";
import type { ChatUIMessage } from "@/lib/ai/trace";

export default async function ChatSessionPage({
  params,
  searchParams,
}: {
  params: Promise<{ sessionId: string }>;
  searchParams: Promise<{ prompt?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) notFound();

  const { sessionId } = await params;
  const { prompt } = await searchParams;

  const session = await prisma.chatSession.findFirst({
    where: { id: sessionId, userId: user.id },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
  if (!session) notFound();

  const initialMessages = session.messages.map((m) => m.content as unknown as ChatUIMessage);

  return (
    <ChatShell
      key={sessionId}
      sessionId={sessionId}
      initialMessages={initialMessages}
      initialPrompt={initialMessages.length === 0 ? prompt : undefined}
    />
  );
}
