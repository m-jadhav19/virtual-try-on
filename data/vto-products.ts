/**
 * VTO products and model config loaded from vto-products.json.
 * Add new categories or model options in the JSON; paths are relative to public or absolute.
 */

export type CategoryId =
  | "glasses"
  | "earrings"
  | "necklace"
  | "ring"
  | "watch"
  | "hat";

export interface VtoProduct {
  id: string;
  name: string;
  modelPath: string;
  occluderPath?: string;
  envmapPath?: string;
  thumbnail?: string;
  /** Hand mode only: scale factor for the 3D model */
  modelScale?: number;
  /** Hand mode only: [x, y, z] offset */
  modelOffset?: [number, number, number];
  /** Hand mode only: [x, y, z, w] quaternion */
  modelQuaternion?: [number, number, number, number];
}

export interface VtoCategory {
  id: CategoryId;
  name: string;
  icon: string;
  glowColor: string;
  products: VtoProduct[];
}

export interface VtoProductsSchema {
  categories: VtoCategory[];
}

import productsJson from "./vto-products.json";

const schema = productsJson as VtoProductsSchema;

export const vtoCategories = schema.categories;

export function getVtoCategoryById(id: string): VtoCategory | undefined {
  return vtoCategories.find((c) => c.id === id);
}

export function getVtoProduct(
  categoryId: CategoryId,
  productId: string
): VtoProduct | undefined {
  const cat = getVtoCategoryById(categoryId);
  return cat?.products.find((p) => p.id === productId);
}

export function getDefaultProductId(category: VtoCategory): string {
  return category.products[0]?.id ?? "";
}
