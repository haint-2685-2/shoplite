/* ==========================================================================
   cart.ts — cart state (module 2 -> 3)
   --------------------------------------------------------------------------
   The one structural change from v2: the cart operations are now PURE.
   addToCart / removeFromCart / updateQty take a `readonly CartItem[]` and
   return a new `CartItem[]` — no localStorage inside. Persistence is a
   separate step (loadCart / saveCart), so a page reads as
       saveCart(addToCart(loadCart(), product))
   and the same functions can become a React reducer in module 4 unchanged.
   ========================================================================== */

import { isCartItem } from './guards.ts';
import { readJSON, writeJSON } from './storage.ts';
import type { CartItem, Product } from './types.ts';

const CART_KEY = 'shoplite.cart';
export const MAX_QTY = 99;

/*
  Declaration merging: WindowEventMap is an interface in lib.dom.d.ts, and
  adding a key here types every addEventListener('cart:change', ...) call —
  `event.detail` comes out as CartItem[] with no cast anywhere.
*/
declare global {
  interface WindowEventMap {
    'cart:change': CustomEvent<CartItem[]>;
  }
}

export function clampQty(qty: number): number {
  const n = Math.trunc(qty);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(n, MAX_QTY);
}

/* --- Pure operations ---------------------------------------------------- */

/** Already in the cart -> bump the quantity. Otherwise -> append a line. */
export function addToCart(cart: readonly CartItem[], product: Product, qty = 1): CartItem[] {
  const exists = cart.some((line) => line.id === product.id);
  if (exists) {
    return cart.map((line) =>
      line.id === product.id ? { ...line, quantity: clampQty(line.quantity + qty) } : line
    );
  }
  return [...cart, { ...product, quantity: clampQty(qty) }];
}

export function removeFromCart(cart: readonly CartItem[], id: number): CartItem[] {
  return cart.filter((line) => line.id !== id);
}

/** Setting a quantity below 1 removes the line — what every real shop does. */
export function updateQty(cart: readonly CartItem[], id: number, qty: number): CartItem[] {
  if (!Number.isFinite(qty) || Math.trunc(qty) < 1) return removeFromCart(cart, id);
  return cart.map((line) => (line.id === id ? { ...line, quantity: clampQty(qty) } : line));
}

export function changeQty(cart: readonly CartItem[], id: number, delta: number): CartItem[] {
  const line = cart.find((item) => item.id === id);
  return line ? updateQty(cart, id, line.quantity + delta) : [...cart];
}

/* --- Derived values: reduce() over the lines ---------------------------- */

export function getLineTotal({ price, quantity }: Pick<CartItem, 'price' | 'quantity'>): number {
  return price * quantity;
}

export function getCartTotal(cart: readonly CartItem[]): number {
  return cart.reduce((sum, line) => sum + getLineTotal(line), 0);
}

export function getCartCount(cart: readonly CartItem[]): number {
  return cart.reduce((n, line) => n + line.quantity, 0);
}

/* --- Persistence -------------------------------------------------------- */

/**
 * Whatever sits in localStorage is `unknown`: a v2 cart (`qty` instead of
 * `quantity`), a hand-edited value, garbage. Lines that fail the guard are
 * dropped one by one instead of throwing the whole cart away.
 */
export function loadCart(): CartItem[] {
  const stored = readJSON(CART_KEY);
  if (!Array.isArray(stored)) return [];
  return stored.filter(isCartItem).map((line) => ({ ...line, quantity: clampQty(line.quantity) }));
}

export function saveCart(cart: readonly CartItem[]): CartItem[] {
  const clean = [...cart];
  writeJSON(CART_KEY, clean);
  // One event, so every listener (header badge, cart page) refreshes itself.
  window.dispatchEvent(new CustomEvent('cart:change', { detail: clean }));
  return clean;
}
