/* ==========================================================================
   api.js — talking to DummyJSON (module 2, day 3)
   --------------------------------------------------------------------------
   The one thing everybody gets wrong on day one: fetch() does NOT reject on
   404 or 500. A dead endpoint still gives you a resolved Promise with
   res.ok === false. So every response goes through the res.ok check below.
   ========================================================================== */

const BASE_URL = 'https://dummyjson.com';

/** Fields we actually render — asking for less keeps the payload small. */
const LIST_FIELDS = 'id,title,price,discountPercentage,rating,stock,brand,category,thumbnail';

/**
 * fetch + status check + json parsing, in one place.
 * Throws on a bad status, on a network failure and on a timeout, so every
 * caller only needs one try/catch.
 */
export async function getJSON(url, { timeout = 10000 } = {}) {
  // AbortController: without it a hanging request keeps the spinner forever.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) {
      throw new Error(`Request failed: ${res.status} ${res.statusText}`);
    }
    return await res.json();
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('The request timed out. Check your connection and try again.');
    }
    throw error;
  } finally {
    clearTimeout(timer); // runs on success AND on failure
  }
}

/** GET /products — returns just the array, the envelope stays in here. */
export async function fetchProducts({ limit = 30, skip = 0 } = {}) {
  const url = `${BASE_URL}/products?limit=${limit}&skip=${skip}&select=${LIST_FIELDS}`;
  const { products = [] } = await getJSON(url);
  return products;
}

/** GET /products/{id} — the detail page needs description and images too. */
export async function fetchProduct(id) {
  return getJSON(`${BASE_URL}/products/${encodeURIComponent(id)}`);
}

/** GET /products/category/{slug} — used for "similar products". */
export async function fetchByCategory(slug, limit = 5) {
  const url = `${BASE_URL}/products/category/${encodeURIComponent(slug)}?limit=${limit}&select=${LIST_FIELDS}`;
  const { products = [] } = await getJSON(url);
  return products;
}
