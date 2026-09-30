/* ==========================================================================
   guards.ts — turning `unknown` into a real type (module 3, day 2)
   --------------------------------------------------------------------------
   res.json() and JSON.parse() both hand back data the compiler knows
   nothing about. Writing `as Product[]` would only silence it — if the API
   changes shape, the page breaks at runtime with no warning.
   A type guard (`value is Product`) checks at runtime AND tells the compiler
   what it proved, so the narrowed type is earned instead of asserted.
   ========================================================================== */

import type { CartItem, Product, ProductPage } from './types.ts';

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

const isNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

export function isProduct(value: unknown): value is Product {
  if (!isRecord(value)) return false;
  return (
    isNumber(value.id) &&
    typeof value.title === 'string' &&
    typeof value.description === 'string' &&
    isNumber(value.price) &&
    isNumber(value.discountPercentage) &&
    isNumber(value.rating) &&
    isNumber(value.stock) &&
    (value.brand === undefined || typeof value.brand === 'string') &&
    typeof value.category === 'string' &&
    typeof value.thumbnail === 'string' &&
    isStringArray(value.images)
  );
}

export function isProductList(value: unknown): value is Product[] {
  return Array.isArray(value) && value.every(isProduct);
}

export function isProductPage(value: unknown): value is ProductPage {
  return isRecord(value) && isProductList(value.products) && isNumber(value.total);
}

export function isCartItem(value: unknown): value is CartItem {
  return isProduct(value) && isRecord(value) && isNumber(value.quantity);
}
