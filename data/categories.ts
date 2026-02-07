/**
 * Category types and helpers. Category list and products come from vto-products.json.
 */

export type CategoryType =
  | "glasses"
  | "earrings"
  | "necklace"
  | "ring"
  | "watch"
  | "hat";

export interface Category {
  id: CategoryType;
  name: string;
  icon: string;
  description: string;
  glowColor: string;
  gradient: string;
  color: string;
}

import {
  vtoCategories,
  getVtoCategoryById as getVtoCat,
  type VtoCategory,
} from "./vto-products";

export const categories: Category[] = vtoCategories.map((c) => ({
  id: c.id as CategoryType,
  name: c.name,
  icon: c.icon,
  description: `Try on ${c.name.toLowerCase()}`,
  glowColor: c.glowColor,
  gradient: "from-primary to-secondary",
  color: "bg-primary",
}));

export function getCategoryById(id: string): Category | undefined {
  const vto = getVtoCat(id);
  if (!vto) return undefined;
  return {
    id: vto.id as CategoryType,
    name: vto.name,
    icon: vto.icon,
    description: `Try on ${vto.name.toLowerCase()}`,
    glowColor: vto.glowColor,
    gradient: "from-primary to-secondary",
    color: "bg-primary",
  };
}

export { vtoCategories, getVtoCategoryById, getVtoProduct, getDefaultProductId } from "./vto-products";
export type { VtoCategory, VtoProduct } from "./vto-products";
