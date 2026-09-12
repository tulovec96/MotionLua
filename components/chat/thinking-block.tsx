"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import type { ReasoningUIPart } from "ai";
import { cn } from "@/lib/utils";

export function ThinkingBlock({ part }: { part: ReasoningUIPart }) {
  const streaming = part.state === "streaming";
  const [expanded, setExpanded] = useState(false);

  const startedAtRef = useRef<number | null>(null);
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (startedAtRef.current === null) startedAtRef.current = Date.now();
    const startedAt = startedAtRef.current;
    if (!streaming) {
      setSeconds(Math.round((Date.now() - startedAt) / 1000));
      return;
    }
    const id = setInterval(() => setSeconds(Math.round((Date.now() - startedAt) / 1000)), 1000);
    return () => clearInterval(id);
  }, [streaming]);

  if (!part.text) return null;

  return (
    <div className="rounded-lg border border-border/40 bg-muted/20 text-xs">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-muted-foreground hover:text-foreground"
      >
        <Sparkles className={cn("size-3.5", streaming && "animate-pulse text-violet-400")} />
        <span>{streaming ? "Thinking…" : `Thought for ${seconds}s`}</span>
        <span className="ml-auto">
          {expanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
        </span>
      </button>
      {expanded ? (
        <p className="whitespace-pre-wrap border-t border-border/40 px-3 py-2 font-mono text-[11px] text-muted-foreground">
          {part.text}
        </p>
      ) : null}
    </div>
  );
}
