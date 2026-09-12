import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { SiteHeader } from "@/components/layout/site-header";
import { SessionSidebar } from "@/components/chat/session-sidebar";

export default async function ChatLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser("/chat");

  const sessions = await prisma.chatSession.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    take: 50,
    select: { id: true, title: true, updatedAt: true },
  });

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <div className="flex flex-1">
        <SessionSidebar
          sessions={sessions.map((s) => ({ ...s, updatedAt: s.updatedAt.toISOString() }))}
        />
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
