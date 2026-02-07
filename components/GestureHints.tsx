"use client";

import { motion } from "motion/react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GestureHintsProps {
  onDismiss: () => void;
}

export function GestureHints({ onDismiss }: GestureHintsProps) {
  const gestures = [
    { icon: "🤏", label: "Pinch to resize", description: "Use two fingers to make it bigger or smaller" },
    { icon: "👆", label: "Drag to move", description: "Touch and drag to reposition" },
    { icon: "✌️", label: "Rotate to adjust", description: "Two finger twist to rotate" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0, y: 8 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.96, opacity: 0, y: 8 }}
        transition={{ duration: 0.2, ease: [0, 0, 0.2, 1] }}
        className="vto-glass max-w-md w-full overflow-hidden"
      >
        <div
          className="p-6 border-b border-[var(--vto-border-soft)]"
          style={{
            background: "linear-gradient(135deg, var(--vto-accent-primary) 0%, var(--vto-accent-secondary) 100%)",
            color: "var(--vto-bg-primary)",
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xl font-bold">Touch Gestures</h3>
            <button
              type="button"
              onClick={onDismiss}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors duration-[120ms]"
            >
              <X className="size-5" />
            </button>
          </div>
          <p className="text-white/90 text-sm">Use these gestures to adjust your try-on</p>
        </div>
        <div className="p-6 space-y-5">
          {gestures.map((gesture, index) => (
            <motion.div
              key={gesture.label}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.08, duration: 0.18 }}
              className="flex items-start gap-4"
            >
              <div
                className="flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center text-3xl"
                style={{
                  background: "rgba(50, 230, 226, 0.15)",
                  border: "1px solid var(--vto-border-soft)",
                  boxShadow: "0 0 12px var(--vto-glow-cyan)",
                }}
              >
                {gesture.icon}
              </div>
              <div className="flex-1 pt-1">
                <h4 className="font-semibold text-[var(--foreground)] mb-1">{gesture.label}</h4>
                <p className="text-sm text-[var(--muted-foreground)]">{gesture.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
        <div className="p-6 border-t border-[var(--vto-border-soft)]">
          <Button onClick={onDismiss} className="w-full" size="lg">
            Got it!
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
