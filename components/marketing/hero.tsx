"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, PlayCircle } from "lucide-react";
import { GradientMeshBg } from "@/components/marketing/gradient-mesh-bg";
import { ChatMockup } from "@/components/marketing/chat-mockup";
import { RobloxSignInButton } from "@/components/layout/roblox-sign-in-button";
import { Button } from "@/components/ui/button";

const HEADLINE_WORDS = ["Build", "Roblox", "games", "with", "AI."];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};
const word = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden px-4 pt-20 pb-24 sm:px-6 sm:pt-28">
      <GradientMeshBg />
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
        <div>
          <motion.h1
            variants={container}
            initial="hidden"
            animate="show"
            className="font-heading text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl"
          >
            {HEADLINE_WORDS.map((w, i) => (
              <motion.span
                key={i}
                variants={word}
                className={
                  i === HEADLINE_WORDS.length - 1
                    ? "mr-3 inline-block bg-gradient-to-r from-violet-400 via-fuchsia-400 to-violet-400 bg-clip-text text-transparent"
                    : "mr-3 inline-block"
                }
              >
                {w}
              </motion.span>
            ))}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="mt-6 max-w-lg text-lg text-muted-foreground"
          >
            Generate scripts, build GUIs, import marketplace assets, and modify your place —
            all from a chat that shows exactly what it&apos;s doing.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65, duration: 0.5 }}
            className="mt-8 flex flex-wrap items-center gap-3"
          >
            <RobloxSignInButton size="lg" className="gap-2 px-5" />
            <Button
              size="lg"
              variant="ghost"
              nativeButton={false}
              className="gap-2"
              render={
                <Link href="#demo">
                  <PlayCircle className="size-4" />
                  Watch demo
                  <ArrowRight className="size-4 transition-transform group-hover/button:translate-x-0.5" />
                </Link>
              }
            />
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.85, duration: 0.5 }}
            className="mt-8 text-sm text-muted-foreground"
          >
            1M+ scripts generated · Trusted by 50,000+ creators
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24, rotate: -1 }}
          animate={{ opacity: 1, y: 0, rotate: 0 }}
          transition={{ delay: 0.3, duration: 0.7, ease: "easeOut" }}
          className="justify-self-center lg:justify-self-end"
        >
          <ChatMockup />
        </motion.div>
      </div>
    </section>
  );
}
