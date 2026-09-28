/* ==========================================================================
   products.ts — pure functions over a product list (module 2 -> 3)
   --------------------------------------------------------------------------
   Same functions as v2, now with explicit parameter and return types.
   `readonly Product[]` on the inputs is a promise the compiler enforces:
   calling .sort() or .push() on the argument is a type error, so "pure"
   is no longer just a comment.
   ========================================================================== */

import type { ListingFilters, Product, SortDir, SortOption } from './types.ts';

/** Case-insensitive search over title, brand and category. */
export function filterByKeyword(list: readonly Product[], q: string): Product[] {
  const needle = q.trim().toLowerCase();
  if (!needle) return [...list]; // a copy, never the original reference
  return list.filter(({ title, brand = '', category }) =>
    `${title} ${brand} ${category}`.toLowerCase().includes(needle)
  );
}

/** Price after the discount percentage DummyJSON ships with each product. */
export function discountedPrice({ price, discountPercentage }: Pick<Product, 'price' | 'discountPercentage'>): number {
  return Math.round(price * (1 - discountPercentage / 100) * 100) / 100;
}

/** Sorts on the price the card actually PRINTS, i.e. after the discount. */
export function sortByPrice(list: readonly Product[], dir: SortDir = 'asc'): Product[] {
  const sign = dir === 'asc' ? 1 : -1;
  // sort() mutates, so sort a copy — with readonly, forgetting is a compile error.
  return [...list].sort((a, b) => (discountedPrice(a) - discountedPrice(b)) * sign);
}

/** The keys that are safe to sort on: only number or string fields. */
type SortableKey = 'price' | 'rating' | 'stock' | 'title' | 'category';

export function sortBy(list: readonly Product[], key: SortableKey, dir: SortDir = 'asc'): Product[] {
  const sign = dir === 'desc' ? -1 : 1;
  return [...list].sort((a, b) => {
    const x = a[key];
    const y = b[key];
    // Narrowing: inside this branch both are known to be strings.
    if (typeof x === 'string' && typeof y === 'string') return x.localeCompare(y) * sign;
    return (Number(x) - Number(y)) * sign;
  });
}

export function filterByCategory(list: readonly Product[], category: string): Product[] {
  if (!category || category === 'all') return [...list];
  return list.filter((p) => p.category === category);
}

/** find() may come back empty — the `| undefined` forces every caller to check. */
export function findById(list: readonly Product[], id: number): Product | undefined {
  return list.find((p) => p.id === id);
}

export function totalValue(list: readonly Product[]): number {
  return list.reduce((sum, p) => sum + discountedPrice(p), 0);
}

export function categoriesOf(list: readonly Product[]): string[] {
  return [...new Set(list.map((p) => p.category))].sort();
}

const SORT_OPTIONS: readonly SortOption[] = ['default', 'price-asc', 'price-desc', 'rating', 'title'];

/** Values from a URL or a <select> are plain strings until proven otherwise. */
export function isSortOption(value: unknown): value is SortOption {
  return SORT_OPTIONS.some((option) => option === value);
}

/** The whole listing pipeline: raw list + UI state in, visible list out. */
export function applyFilters(list: readonly Product[], { q, category, sort }: ListingFilters): Product[] {
  const found = filterByKeyword(filterByCategory(list, category), q);

  // A switch over a union: drop a case and `never` below stops compiling.
  switch (sort) {
    case 'price-asc':
      return sortByPrice(found, 'asc');
    case 'price-desc':
      return sortByPrice(found, 'desc');
    case 'rating':
      return sortBy(found, 'rating', 'desc');
    case 'title':
      return sortBy(found, 'title', 'asc');
    case 'default':
      return found;
    default: {
      const unreachable: never = sort;
      return unreachable;
    }
  }
}
