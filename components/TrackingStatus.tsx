"use client";

import { motion, AnimatePresence } from "motion/react";
import { CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";

export type TrackingState = "stable" | "warning" | "searching";

interface TrackingStatusProps {
  state: TrackingState;
  message: string;
}

const statusConfig = {
  stable: {
    icon: CheckCircle2,
    bg: "var(--vto-status-success)",
    text: "#fafafa",
    glow: "#3FE28C",
  },
  warning: {
    icon: AlertCircle,
    bg: "var(--vto-status-warning)",
    text: "#fafafa",
    glow: "#FFB547",
  },
  searching: {
    icon: RefreshCw,
    bg: "var(--vto-status-info)",
    text: "#fafafa",
    glow: "#5DA9FF",
  },
};

export function TrackingStatus({ state, message }: TrackingStatusProps) {
  const { icon: Icon, bg, text, glow } = statusConfig[state];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={state}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.18, ease: [0, 0, 0.2, 1] }}
        className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium backdrop-blur-md border border-[var(--vto-border-soft)]"
        style={{
          background: "var(--vto-bg-glass)",
          color: text,
          boxShadow: `0 0 12px ${glow}`,
        }}
      >
        <Icon
          className={`size-4 shrink-0 ${state === "searching" ? "animate-spin" : ""}`}
          style={{ color: text }}
        />
        <span>{message}</span>
      </motion.div>
    </AnimatePresence>
  );
}
