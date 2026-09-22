/* ==========================================================================
   cart.js — cart state (module 2, day 3)
   --------------------------------------------------------------------------
   The cart lives in localStorage under one key, as an array of lines:
     { id, title, price, thumbnail, category, qty }
   Price is copied INTO the line on purpose: the cart has to render, and add
   up, without a network call. Every mutating function returns the new cart,
   so callers can re-render from the return value instead of re-reading.
   ========================================================================== */

import { readJSON, writeJSON } from './storage.js';

const CART_KEY = 'shoplite.cart';
const MAX_QTY = 99;

/** Anything stored by an older build, or by hand, is filtered out here. */
function normalize(list) {
  if (!Array.isArray(list)) return [];
  return list
    .filter((line) => line && line.id !== undefined && Number.isFinite(Number(line.price)))
    .map(({ id, title = 'Unknown product', price, thumbnail = '', category = '', qty }) => ({
      id,
      title,
      price: Number(price),
      thumbnail,
      category,
      qty: clampQty(qty),
    }));
}

function clampQty(qty) {
  const n = Math.trunc(Number(qty));
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(n, MAX_QTY);
}

export function loadCart() {
  return normalize(readJSON(CART_KEY, []));
}

export function saveCart(cart) {
  const clean = normalize(cart);
  writeJSON(CART_KEY, clean);
  // One event, so every listener (header badge, cart page) refreshes itself.
  window.dispatchEvent(new CustomEvent('cart:change', { detail: clean }));
  return clean;
}

/** Already in the cart -> bump the quantity. Otherwise -> append a line. */
export function addToCart(product, qty = 1) {
  const cart = loadCart();
  const line = cart.find((item) => String(item.id) === String(product.id));

  if (line) {
    line.qty = clampQty(line.qty + qty);
  } else {
    cart.push({
      id: product.id,
      title: product.title,
      price: Number(product.price),
      thumbnail: product.thumbnail ?? product.images?.[0] ?? '',
      category: product.category ?? '',
      qty: clampQty(qty),
    });
  }
  return saveCart(cart);
}

export function removeFromCart(id) {
  return saveCart(loadCart().filter((line) => String(line.id) !== String(id)));
}

/** Setting a quantity below 1 removes the line — what every real shop does. */
export function updateQty(id, qty) {
  const next = clampQty(qty);
  if (Math.trunc(Number(qty)) < 1) return removeFromCart(id);

  return saveCart(
    loadCart().map((line) => (String(line.id) === String(id) ? { ...line, qty: next } : line))
  );
}

export function changeQty(id, delta) {
  const line = loadCart().find((item) => String(item.id) === String(id));
  if (!line) return loadCart();
  return updateQty(id, line.qty + delta);
}

export function clearCart() {
  return saveCart([]);
}

/* --- Derived values: reduce() over the lines ---------------------------- */

export function getCartTotal(cart = loadCart()) {
  return cart.reduce((sum, line) => sum + line.price * line.qty, 0);
}

export function getCartCount(cart = loadCart()) {
  return cart.reduce((n, line) => n + line.qty, 0);
}

export function getLineTotal(line) {
  return line.price * line.qty;
}
