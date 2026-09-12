"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, ChevronUp, Loader2, X } from "lucide-react";
import type { ToolUIPart } from "ai";
import { DiffView } from "@/components/chat/diff-view";
import { TOOL_LABELS } from "@/components/chat/tool-labels";
import type { ToolName } from "@/lib/ai/tool-registry";
import { cn } from "@/lib/utils";

export function StepCard({ part }: { part: ToolUIPart }) {
  const [expanded, setExpanded] = useState(false);
  const toolName = part.type.replace(/^tool-/, "") as ToolName;
  const labels = TOOL_LABELS[toolName];
  const running = part.state === "input-streaming" || part.state === "input-available";
  const errored = part.state === "output-error";

  const startedAtRef = useRef<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  useEffect(() => {
    if (!running) return;
    if (startedAtRef.current === null) startedAtRef.current = Date.now();
    const id = setInterval(() => setElapsedMs(Date.now() - (startedAtRef.current ?? Date.now())), 500);
    return () => clearInterval(id);
  }, [running]);

  const input = "input" in part ? part.input : undefined;
  const output = "output" in part ? part.output : undefined;

  const label = running
    ? labels?.running ?? `Running ${toolName}`
    : errored
      ? `Failed: ${labels?.running ?? toolName}`
      : (labels?.done(input, output) ?? toolName);

  const diffPayload =
    output && typeof output === "object" && "before" in output && "after" in output
      ? (output as { path?: string; before: string; after: string })
      : null;

  return (
    <div className="overflow-hidden rounded-lg border border-border/60 bg-card/40 text-sm">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-center gap-2.5 px-3 py-2 text-left hover:bg-muted/30"
      >
        <span
          className={cn(
            "flex size-5 shrink-0 items-center justify-center rounded-full",
            errored
              ? "bg-rose-500/20 text-rose-400"
              : running
                ? "bg-violet-500/20 text-violet-400"
                : "bg-emerald-500/20 text-emerald-400"
          )}
        >
          {errored ? (
            <X className="size-3.5" />
          ) : running ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Check className="size-3.5" />
          )}
        </span>
        <span className="truncate text-foreground/85">{label}</span>
        {running ? (
          <span className="ml-auto shrink-0 font-mono text-[11px] text-muted-foreground">
            {(elapsedMs / 1000).toFixed(1)}s
          </span>
        ) : (
          <span className="ml-auto shrink-0 text-muted-foreground">
            {expanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
          </span>
        )}
      </button>

      {expanded && !running ? (
        <div className="border-t border-border/60 px-3 py-2.5">
          {errored ? (
            <p className="text-xs text-rose-400">{part.errorText}</p>
          ) : diffPayload ? (
            <DiffView before={diffPayload.before} after={diffPayload.after} path={diffPayload.path} />
          ) : (
            <pre className="max-h-64 overflow-auto whitespace-pre-wrap font-mono text-[11px] text-muted-foreground">
              {JSON.stringify({ input, output }, null, 2)}
            </pre>
          )}
        </div>
      ) : null}
    </div>
  );
}
