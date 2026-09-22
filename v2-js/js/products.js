/* ==========================================================================
   products.js — pure functions over a product list (module 2, day 1)
   --------------------------------------------------------------------------
   "Pure" means: same input -> same output, and the input is never mutated.
   filter / map / slice all return NEW arrays, so the original list stays
   untouched and can be filtered again from scratch on the next keystroke.
   Nothing here touches the DOM — that is what makes it reusable in module 3+.
   ========================================================================== */

/** Case-insensitive search over title, brand and category. */
export function filterByKeyword(list, q) {
  const needle = String(q ?? '').trim().toLowerCase();
  if (!needle) return [...list]; // a copy, never the original reference
  return list.filter(({ title = '', brand = '', category = '' }) =>
    `${title} ${brand} ${category}`.toLowerCase().includes(needle)
  );
}

/** Price after the discount percentage DummyJSON ships with each product. */
export function discountedPrice({ price, discountPercentage = 0 }) {
  return Math.round(price * (1 - discountPercentage / 100) * 100) / 100;
}

/**
 * dir: 'asc' (cheapest first) | 'desc' (priciest first) | anything else = keep order.
 * Sorts on the price the card actually PRINTS, i.e. after the discount —
 * sorting on the struck-through price puts the list visibly out of order.
 */
export function sortByPrice(list, dir = 'asc') {
  if (dir !== 'asc' && dir !== 'desc') return [...list];
  // sort() mutates, so sort a copy — this is the classic pure-function trap.
  const sign = dir === 'asc' ? 1 : -1;
  return [...list].sort((a, b) => (discountedPrice(a) - discountedPrice(b)) * sign);
}

/** Sort by any comparable field, with price as the default. */
export function sortBy(list, key = 'price', dir = 'asc') {
  const sign = dir === 'desc' ? -1 : 1;
  return [...list].sort((a, b) => {
    const [x, y] = [a[key], b[key]];
    if (typeof x === 'string' || typeof y === 'string') {
      return String(x).localeCompare(String(y)) * sign;
    }
    return (x - y) * sign;
  });
}

export function filterByCategory(list, category) {
  if (!category || category === 'all') return [...list];
  return list.filter((p) => p.category === category);
}

/** find() returns the first match or undefined — ids from a URL are strings. */
export function findById(list, id) {
  return list.find((p) => String(p.id) === String(id));
}

/** reduce(): fold a list down to one number. */
export function totalValue(list) {
  return list.reduce((sum, p) => sum + discountedPrice(p), 0);
}

/** Every distinct category, sorted — derived, never hard-coded. */
export function categoriesOf(list) {
  return [...new Set(list.map((p) => p.category))].sort();
}

/**
 * The whole listing pipeline in one call, so the page only ever holds
 * the raw list plus the current UI state.
 */
export function applyFilters(list, { q = '', category = 'all', sort = 'default' } = {}) {
  const found = filterByKeyword(filterByCategory(list, category), q);
  if (sort === 'price-asc') return sortByPrice(found, 'asc');
  if (sort === 'price-desc') return sortByPrice(found, 'desc');
  if (sort === 'rating') return sortBy(found, 'rating', 'desc');
  if (sort === 'title') return sortBy(found, 'title', 'asc');
  return found;
}
