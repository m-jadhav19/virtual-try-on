"use client";

import { motion, AnimatePresence } from "motion/react";

export type TrackingState = "stable" | "warning" | "searching";

interface TrackingStatusProps {
  state: TrackingState;
  message: string;
}

const dotColor = {
  stable: "#3FE28C",
  warning: "#FFB547",
  searching: "rgba(255,255,255,0.85)",
};

export function TrackingStatus({ state, message }: TrackingStatusProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={state}
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
        className="flex items-center gap-2 h-8 px-3 rounded-full bg-black/55 backdrop-blur-md border border-white/15 text-[13px] text-white/90 max-w-[220px]"
      >
        <span
          className={`size-1.5 shrink-0 rounded-full ${state === "searching" ? "animate-pulse" : ""}`}
          style={{ background: dotColor[state] }}
        />
        <span className="truncate">{message}</span>
      </motion.div>
    </AnimatePresence>
  );
}
