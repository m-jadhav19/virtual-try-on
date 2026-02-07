"use client";

import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import { ReactNode } from "react";
import { Button } from "./ui/button";

interface MobileBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function MobileBottomSheet({ isOpen, onClose, title, children }: MobileBottomSheetProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: [0.4, 0, 1, 1] }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          />
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 } as any}
            transition={{
              duration: 0.28,
              ease: [0, 0, 0.2, 1],
              opacity: { duration: 0.18 },
            } as any}
            className="vto-glass fixed bottom-0 left-0 right-0 z-50 lg:hidden max-h-[80vh] flex flex-col rounded-t-2xl"
          >
            <div className="flex items-center justify-center pt-3 pb-2">
              <div className="w-12 h-1.5 rounded-full bg-(--vto-border-soft)" />
            </div>
            <div className="flex items-center justify-between px-6 py-4 border-b border-(--vto-border-soft)">
              <h3 className="font-semibold text-lg text-(--foreground)">{title}</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full text-(--muted-foreground) hover:text-(--foreground) hover:bg-(--vto-bg-secondary) transition-colors duration-(--vto-motion-fast)"
              >
                <X className="size-5" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
