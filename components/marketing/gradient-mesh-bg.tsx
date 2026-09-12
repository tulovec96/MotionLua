"use client";

import { motion } from "framer-motion";

/**
 * Slow, continuously looping gradient glows behind the hero. Pure CSS blur +
 * Framer Motion transform loops — no canvas/WebGL, since it's decorative.
 */
export function GradientMeshBg() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,theme(colors.white/4%)_1px,transparent_1px),linear-gradient(to_bottom,theme(colors.white/4%)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,black_40%,transparent_100%)]" />
      <motion.div
        className="absolute -top-32 left-1/2 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-violet-500/25 blur-[120px]"
        animate={{ x: [0, 40, -20, 0], y: [0, 20, -10, 0] }}
        transition={{ duration: 24, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-10 right-[10%] h-80 w-80 rounded-full bg-fuchsia-500/20 blur-[100px]"
        animate={{ x: [0, -30, 10, 0], y: [0, 15, -20, 0] }}
        transition={{ duration: 28, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-40 left-[8%] h-64 w-64 rounded-full bg-cyan-500/10 blur-[100px]"
        animate={{ x: [0, 20, -10, 0], y: [0, -15, 10, 0] }}
        transition={{ duration: 32, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
      />
    </div>
  );
}
