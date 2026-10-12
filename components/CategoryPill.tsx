"use client";

import { CategoryType } from "@/data/categories";

interface CategoryPillProps {
  icon: string;
  label: string;
  categoryId: CategoryType;
  isActive: boolean;
  onClick: () => void;
}

export function CategoryPill({ label, isActive, onClick }: CategoryPillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 h-8 px-3 rounded-full text-[13px] tracking-tight transition-colors ${
        isActive
          ? "bg-white text-black"
          : "text-white/65 hover:text-white hover:bg-white/10"
      }`}
    >
      {label}
    </button>
  );
}
