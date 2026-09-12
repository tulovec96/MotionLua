import Link from "next/link";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SessionSummary {
  id: string;
  title: string;
  updatedAt: string;
}

export function SessionSidebar({
  sessions,
  activeId,
}: {
  sessions: SessionSummary[];
  activeId?: string;
}) {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-border/60 sm:flex">
      <div className="p-3">
        <Link
          href="/chat"
          className="flex items-center justify-center gap-2 rounded-lg border border-border/60 px-3 py-2 text-sm hover:bg-muted/40"
        >
          <Plus className="size-4" />
          New chat
        </Link>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 pb-3">
        {sessions.map((s) => (
          <Link
            key={s.id}
            href={`/chat/${s.id}`}
            className={cn(
              "block truncate rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted/40 hover:text-foreground",
              s.id === activeId && "bg-muted/60 text-foreground"
            )}
          >
            {s.title}
          </Link>
        ))}
        {sessions.length === 0 ? (
          <p className="px-3 py-2 text-xs text-muted-foreground">No chats yet.</p>
        ) : null}
      </nav>
    </aside>
  );
}
