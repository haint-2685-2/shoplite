/* ==========================================================================
   types.ts — the shapes every other file agrees on (module 3, day 1)
   --------------------------------------------------------------------------
   Nothing in here exists at runtime: the compiler erases this whole file.
   Its only job is to let tsc catch a typo like `product.prise` or a string
   where a number belongs BEFORE the code ever reaches a browser.

   Convention: objects -> interface, everything else (unions, aliases,
   generics over a union) -> type.
   ========================================================================== */

/** One product exactly as DummyJSON returns it (the fields ShopLite uses). */
export interface Product {
  readonly id: number;
  title: string;
  description: string;
  price: number;
  discountPercentage: number;
  rating: number;
  stock: number;
  /** Some DummyJSON categories (groceries, for one) ship without a brand. */
  brand?: string;
  category: string;
  thumbnail: string;
  images: string[];
}

/** A line in the cart: the whole product, plus how many of it. */
export interface CartItem extends Product {
  quantity: number;
}

export type SortDir = 'asc' | 'desc';

/** The values of the sort <select> on index.html. */
export type SortOption = 'default' | 'price-asc' | 'price-desc' | 'rating' | 'title';

/** Everything the listing needs besides the raw product list. */
export interface ListingFilters {
  q: string;
  /** A category slug, or "all" for no category filter. */
  category: string;
  sort: SortOption;
}

export type FetchStatus = 'idle' | 'loading' | 'error' | 'success';

/**
 * The state of one request. Kept to the shape the course asks for; the
 * day-2 lab shows the stricter discriminated-union version next to it.
 */
export type FetchState<T> = {
  status: FetchStatus;
  data?: T;
  error?: string;
};

/** DummyJSON wraps every list in an envelope. */
export interface ProductPage {
  products: Product[];
  total: number;
  skip: number;
  limit: number;
}
