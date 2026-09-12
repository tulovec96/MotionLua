"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { computeDiff } from "@/lib/ai/diff-utils";
import { cn } from "@/lib/utils";

export function DiffView({ before, after, path }: { before: string; after: string; path?: string }) {
  const [expanded, setExpanded] = useState(false);
  const diff = computeDiff(before, after);
  const isCollapsed = diff.hiddenCount > 0;

  const firstHalf = isCollapsed ? diff.visibleLines.slice(0, 10) : diff.visibleLines;
  const secondHalf = isCollapsed ? diff.visibleLines.slice(10) : [];

  return (
    <div className="overflow-hidden rounded-lg border border-border/60 font-mono text-xs">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-center gap-2 bg-muted/40 px-3 py-1.5 text-left hover:bg-muted/60"
      >
        {path ? <span className="truncate text-foreground/80">{path}</span> : null}
        <span className="ml-auto flex items-center gap-1.5 shrink-0">
          <span className="text-emerald-400">+{diff.added}</span>
          <span className="text-rose-400">−{diff.removed}</span>
          {expanded ? (
            <ChevronUp className="size-3.5 text-muted-foreground" />
          ) : (
            <ChevronDown className="size-3.5 text-muted-foreground" />
          )}
        </span>
      </button>
      {expanded ? (
        <div>
          {firstHalf.map((line, i) => (
            <DiffLineRow key={`a-${i}`} type={line.type} text={line.text} />
          ))}
          {isCollapsed ? (
            <div className="border-y border-border/40 bg-muted/20 px-3 py-1 text-center text-[11px] text-muted-foreground">
              ⋯ {diff.hiddenCount} more changed lines hidden
            </div>
          ) : null}
          {secondHalf.map((line, i) => (
            <DiffLineRow key={`b-${i}`} type={line.type} text={line.text} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function DiffLineRow({ type, text }: { type: "add" | "remove"; text: string }) {
  return (
    <div
      className={cn(
        "whitespace-pre px-3 py-0.5",
        type === "add" ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
      )}
    >
      {type === "add" ? "+ " : "- "}
      {text || " "}
    </div>
  );
}
