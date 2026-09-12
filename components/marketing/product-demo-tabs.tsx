"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2, Search, Play, Terminal, Package } from "lucide-react";
import { Reveal } from "@/components/marketing/animate-in";
import { cn } from "@/lib/utils";

const TABS = [
  {
    id: "chat",
    label: "Chat → Script",
    prompt: "Add a double-jump ability with a cooldown indicator",
    steps: [
      { icon: Check, label: "Read PlayerController.luau · 86 lines", done: true },
      { icon: Check, label: "Edited PlayerController.luau", done: true, badge: "+48 −12" },
      { icon: Loader2, label: "Creating CooldownIndicator GUI…", done: false },
    ],
  },
  {
    id: "import",
    label: "Import assets",
    prompt: "Find a sci-fi laser sound effect and add it to the blaster",
    steps: [
      { icon: Search, label: "Searched Marketplace for \"sci-fi laser\"", done: true, badge: "12 results" },
      { icon: Package, label: "Imported Sound · Laser_Blast_02", done: true },
      { icon: Loader2, label: "Wiring SoundId into Blaster tool…", done: false },
    ],
  },
  {
    id: "playtest",
    label: "Playtest",
    prompt: "Start a playtest and check the console for errors",
    steps: [
      { icon: Play, label: "Started playtest · Solo mode", done: true },
      { icon: Terminal, label: "Captured console output", done: true, badge: "0 errors" },
      { icon: Loader2, label: "Watching for runtime warnings…", done: false },
    ],
  },
];

export function ProductDemoTabs() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => setActive((a) => (a + 1) % TABS.length), 6000);
    return () => clearInterval(id);
  }, [paused]);

  const tab = TABS[active];

  return (
    <section id="demo" className="mx-auto max-w-4xl px-4 py-24 sm:px-6">
      <Reveal className="mb-10 text-center">
        <h2 className="font-heading text-3xl font-semibold sm:text-4xl">See it in action</h2>
        <p className="mt-3 text-muted-foreground">
          The same live trace, whether you&apos;re scripting, importing, or testing.
        </p>
      </Reveal>

      <Reveal>
        <div
          className="rounded-2xl border border-border/60 bg-card/60 p-6 backdrop-blur"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div className="mb-6 flex flex-wrap justify-center gap-2">
            {TABS.map((t, i) => (
              <button
                key={t.id}
                onClick={() => setActive(i)}
                className={cn(
                  "rounded-full px-4 py-1.5 text-sm transition-colors",
                  i === active
                    ? "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={tab.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="mx-auto max-w-lg"
            >
              <p className="mb-4 rounded-lg bg-muted/50 px-4 py-2.5 text-sm">{tab.prompt}</p>
              <div className="flex flex-col gap-2">
                {tab.steps.map((step, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2.5 rounded-lg border border-border/50 bg-background/40 px-3 py-2 text-sm"
                  >
                    <span
                      className={cn(
                        "flex size-5 items-center justify-center rounded-full",
                        step.done ? "bg-emerald-500/20 text-emerald-400" : "bg-violet-500/20 text-violet-400"
                      )}
                    >
                      <step.icon className={cn("size-3.5", !step.done && "animate-spin")} />
                    </span>
                    <span className="text-foreground/85">{step.label}</span>
                    {"badge" in step && step.badge ? (
                      <span className="ml-auto rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                        {step.badge}
                      </span>
                    ) : null}
                  </div>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </Reveal>
    </section>
  );
}
