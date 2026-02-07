"use client";

import { motion } from "motion/react";
import { CategoryType, getCategoryById } from "@/data/categories";

interface CategoryPillProps {
  icon: string;
  label: string;
  categoryId: CategoryType;
  isActive: boolean;
  onClick: () => void;
}

export function CategoryPill({ icon, label, categoryId, isActive, onClick }: CategoryPillProps) {
  const category = getCategoryById(categoryId);
  const hex = category?.glowColor ?? "#7C7CFF";
  const glowRgb = `${parseInt(hex.slice(1, 3), 16)}, ${parseInt(hex.slice(3, 5), 16)}, ${parseInt(hex.slice(5, 7), 16)}`;

  return (
    <motion.button
      whileHover={!isActive ? { scale: 1.02 } : undefined}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.18, ease: [0, 0, 0.2, 1] }}
      onClick={onClick}
      className={`
        flex items-center gap-2 px-4 py-2.5 rounded-full font-medium text-sm
        transition-all duration-[180ms] ease-[cubic-bezier(0,0,0.2,1)]
        ${isActive
          ? "text-white border border-[var(--vto-border-soft)] translate-y-[-2px]"
          : "vto-glass text-[rgba(255,255,255,0.7)] border border-transparent hover:text-[rgba(255,255,255,0.95)]"
        }
      `}
      style={
        isActive
          ? {
              background: `rgba(${glowRgb}, 0.2)`,
              boxShadow: `0 0 0 1px rgba(${glowRgb}, 0.25), 0 0 18px rgba(${glowRgb}, 0.35)`,
            }
          : undefined
      }
    >
      <span className="text-lg">{icon}</span>
      <span className="hidden sm:inline">{label}</span>
    </motion.button>
  );
}
