"use client";

import { motion } from "framer-motion";
import { Check, Loader2, FileCode2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * A self-contained visual of the product's signature step-card UX, used in
 * the hero mockup and the product demo tabs. Deliberately not sharing code
 * with the real chat components (built in a later phase) — this is
 * marketing chrome, not a live chat session.
 */
export function ChatMockup({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "w-full max-w-md rounded-2xl border border-border/60 bg-card/90 p-4 shadow-2xl shadow-violet-950/40 backdrop-blur",
        className
      )}
    >
      <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
        <Sparkles className="size-3.5 text-violet-400" />
        <span>RobloAI</span>
        <span className="ml-auto rounded-full bg-muted px-2 py-0.5 font-mono text-[10px]">
          1,247 tokens
        </span>
      </div>

      <p className="mb-3 rounded-lg bg-muted/50 px-3 py-2 text-sm text-foreground/90">
        Add a double-jump ability with a cooldown indicator
      </p>

      <div className="flex flex-col gap-2">
        <StepRow icon={<Check className="size-3.5" />} done label="Read PlayerController.luau · 86 lines" />
        <StepRow
          icon={<FileCode2 className="size-3.5" />}
          done
          label="Edited PlayerController.luau"
          badge="+48 −12"
        />
        <DiffPreview />
        <StepRow
          icon={<Loader2 className="size-3.5 animate-spin" />}
          label="Creating CooldownIndicator GUI…"
        />
      </div>
    </div>
  );
}

function StepRow({
  icon,
  label,
  done,
  badge,
}: {
  icon: React.ReactNode;
  label: string;
  done?: boolean;
  badge?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="flex items-center gap-2 rounded-lg border border-border/50 bg-background/40 px-2.5 py-1.5 text-xs"
    >
      <span
        className={cn(
          "flex size-4 items-center justify-center rounded-full",
          done ? "bg-emerald-500/20 text-emerald-400" : "bg-violet-500/20 text-violet-400"
        )}
      >
        {icon}
      </span>
      <span className="text-foreground/80">{label}</span>
      {badge ? (
        <span className="ml-auto rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
          {badge}
        </span>
      ) : null}
    </motion.div>
  );
}

function DiffPreview() {
  return (
    <div className="ml-6 overflow-hidden rounded-md border border-border/40 font-mono text-[10px] leading-relaxed">
      <div className="bg-rose-500/10 px-2 py-0.5 text-rose-400">
        - local JUMP_COOLDOWN = 0
      </div>
      <div className="bg-emerald-500/10 px-2 py-0.5 text-emerald-400">
        + local JUMP_COOLDOWN = 1.5
      </div>
      <div className="bg-emerald-500/10 px-2 py-0.5 text-emerald-400">
        + local lastDoubleJumpAt = 0
      </div>
    </div>
  );
}
