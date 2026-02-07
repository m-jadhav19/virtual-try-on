"use client";

import { motion } from "motion/react";
import { CategoryType } from "@/data/categories";

interface Product {
  id: string;
  name: string;
  thumbnail: string;
}

interface ProductTrayProps {
  category: CategoryType;
  categoryIcon: string;
  categoryName: string;
  currentProduct: Product;
  onProductChange?: (product: Product) => void;
}

export function ProductTray({
  category,
  categoryIcon,
  categoryName,
  currentProduct,
}: ProductTrayProps) {
  return (
    <motion.div
      initial={{ y: 12, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.28, ease: [0, 0, 0.2, 1] }}
      className="vto-glass border-t border-[var(--vto-border-soft)] rounded-none px-6 py-4"
    >
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center border border-[var(--vto-border-soft)]"
            style={{ background: "var(--vto-bg-secondary)" }}
          >
            <span className="text-2xl">{categoryIcon}</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-[var(--foreground)]">{categoryName}</span>
              <span className="text-[var(--muted-foreground)]">|</span>
              <span className="text-sm text-[var(--muted-foreground)]">{currentProduct.name}</span>
            </div>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
              Single asset view • More coming soon
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
