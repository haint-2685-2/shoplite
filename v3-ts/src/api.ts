/* ==========================================================================
   api.ts — talking to DummyJSON (module 2 -> 3)
   --------------------------------------------------------------------------
   res.json() is typed `Promise<any>`, which would silently switch type
   checking off for everything downstream. So the parsed body is stored as
   `unknown` and has to pass a guard before getJSON<T>() hands it back as T.
   The generic keeps ONE helper for every endpoint; the guard keeps the T
   honest.
   ========================================================================== */

import { isProduct, isProductPage } from './guards.ts';
import type { FetchState, Product } from './types.ts';

const BASE_URL = 'https://dummyjson.com';

/** Every field of `Product` — asking for exactly these keeps the payload small. */
const PRODUCT_FIELDS = [
  'id',
  'title',
  'description',
  'price',
  'discountPercentage',
  'rating',
  'stock',
  'brand',
  'category',
  'thumbnail',
  'images',
] as const satisfies readonly (keyof Product)[];

const SELECT = PRODUCT_FIELDS.join(',');

interface GetJSONOptions {
  timeout?: number;
}

/**
 * fetch + status check + parse + shape check, in one place.
 * Throws on a bad status, a network failure, a timeout and an unexpected
 * body, so every caller only needs one try/catch.
 */
export async function getJSON<T>(
  url: string,
  isT: (value: unknown) => value is T,
  { timeout = 10_000 }: GetJSONOptions = {}
): Promise<T> {
  // AbortController: without it a hanging request keeps the skeleton forever.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) {
      throw new Error(`Request failed: ${res.status} ${res.statusText}`);
    }
    const body: unknown = await res.json();
    if (!isT(body)) {
      throw new Error(`Unexpected response shape from ${new URL(url).pathname}`);
    }
    return body; // narrowed to T by the guard, no `as` needed
  } catch (error) {
    // In strict mode a caught value is `unknown`: anything can be thrown.
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('The request timed out. Check your connection and try again.');
    }
    throw error;
  } finally {
    clearTimeout(timer); // runs on success AND on failure
  }
}

interface PageOptions {
  limit?: number;
  skip?: number;
}

/** GET /products — returns just the array, the envelope stays in here. */
export async function fetchProducts({ limit = 30, skip = 0 }: PageOptions = {}): Promise<Product[]> {
  const url = `${BASE_URL}/products?limit=${limit}&skip=${skip}&select=${SELECT}`;
  const page = await getJSON(url, isProductPage); // T is inferred from the guard
  return page.products;
}

/** GET /products/{id} */
export async function fetchProduct(id: number): Promise<Product> {
  return getJSON(`${BASE_URL}/products/${id}?select=${SELECT}`, isProduct);
}

/** GET /products/category/{slug} — used for "similar products". */
export async function fetchByCategory(slug: string, limit = 5): Promise<Product[]> {
  const url = `${BASE_URL}/products/category/${encodeURIComponent(slug)}?limit=${limit}&select=${SELECT}`;
  const page = await getJSON(url, isProductPage);
  return page.products;
}

/** A thrown value is `unknown` — this is the one place that turns it into text. */
export function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Something went wrong.';
}

/**
 * Wraps any request in a FetchState, so a page can branch on `status`
 * instead of nesting try/catch around every await.
 */
export async function toFetchState<T>(request: Promise<T>): Promise<FetchState<T>> {
  try {
    return { status: 'success', data: await request };
  } catch (error) {
    return { status: 'error', error: errorMessage(error) };
  }
}
