"use client";

import { motion } from "motion/react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GestureHintsProps {
  onDismiss: () => void;
}

export function GestureHints({ onDismiss }: GestureHintsProps) {
  const gestures = [
    { label: "Pinch", description: "Resize the piece with two fingers" },
    { label: "Drag", description: "Move it into place" },
    { label: "Twist", description: "Rotate with two fingers" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 bg-black/55 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
    >
      <motion.div
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 16, opacity: 0 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        className="vto-glass max-w-sm w-full overflow-hidden rounded-3xl"
      >
        <div className="flex items-start justify-between gap-4 px-5 pt-5 pb-2">
          <div>
            <h3 className="text-[17px] font-medium tracking-tight text-white">Adjust the fit</h3>
            <p className="text-[13px] text-white/55 mt-1">These gestures work on the piece.</p>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Close"
            className="size-8 flex items-center justify-center rounded-full text-white/70 hover:bg-white/10 hover:text-white"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="px-5 py-3 space-y-3">
          {gestures.map((gesture) => (
            <div key={gesture.label} className="flex items-baseline gap-4">
              <h4 className="w-14 shrink-0 text-[13px] font-medium text-white">{gesture.label}</h4>
              <p className="text-[13px] text-white/55">{gesture.description}</p>
            </div>
          ))}
        </div>
        <div className="p-4">
          <Button onClick={onDismiss} className="w-full" size="lg">
            Continue
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
