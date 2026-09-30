/* ==========================================================================
   ui.ts — shared rendering helpers (module 2 -> 3)
   --------------------------------------------------------------------------
   Every function returns a STRING of HTML or writes into a container, same
   as v2. What TypeScript adds: productCardHTML(product: Product) can no
   longer be called with half an object, and a template that reads a field
   the type does not have is a compile error instead of "undefined" on
   screen.
   ========================================================================== */

import { getCartCount, loadCart } from './cart.ts';
import { $maybe } from './dom.ts';
import { discountedPrice } from './products.ts';
import { readJSON, readString, writeJSON, writeString } from './storage.ts';
import { isStringArray } from './guards.ts';
import type { Product } from './types.ts';

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export const formatPrice = (n: number): string => money.format(Number.isFinite(n) ? n : 0);

/**
 * Anything coming from an API ends up inside innerHTML, so it is escaped
 * first. `unknown` on purpose: numbers, undefined and strings all go in.
 */
export function escapeHTML(value: unknown): string {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

/** "home-decoration" -> "Home decoration" */
export function labelOf(slug: string): string {
  const text = slug.replaceAll('-', ' ');
  return text.charAt(0).toUpperCase() + text.slice(1);
}

const STAR = `<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5-5.9-3.2-5.9 3.2 1.2-6.5L2.5 9.4l6.6-.9z"></path></svg>`;

/** Only the two fields it reads — so a CartItem or a Product both fit. */
type Priced = Pick<Product, 'price' | 'discountPercentage'>;

/** Price after discount, plus the original struck through when there is one. */
export function priceHTML(product: Priced, extraClass = '', trailing = ''): string {
  const { price, discountPercentage } = product;
  const was =
    discountPercentage > 0 ? `<span class="price__was">${formatPrice(price)}</span>` : '';
  return `<p class="price ${extraClass}"><span class="price__now">${formatPrice(discountedPrice(product))}</span>${was}${trailing}</p>`;
}

/** One product card, reused by the grid and by "similar products". */
export function productCardHTML(product: Product): string {
  const { id, title, thumbnail, category, rating, discountPercentage } = product;
  const flag =
    discountPercentage >= 1
      ? `<span class="product-card__flag">-${Math.round(discountPercentage)}%</span>`
      : '';

  return `
    <li>
      <article class="product-card" data-id="${id}">
        <div class="product-card__media">
          <img class="product-card__img" src="${escapeHTML(thumbnail)}" width="440" height="440"
               alt="${escapeHTML(title)}" loading="lazy">
          ${flag}
        </div>
        <span class="tag">${escapeHTML(labelOf(category))}</span>
        <h3 class="product-card__title">
          <a href="product.html?id=${id}">${escapeHTML(title)}</a>
        </h3>
        <p class="rating">${STAR} ${rating.toFixed(1)}</p>
        ${priceHTML(product)}
        <button class="btn btn--primary" type="button" data-action="add-to-cart">
          Add to cart<span class="visually-hidden"> — ${escapeHTML(title)}</span>
        </button>
      </article>
    </li>`;
}

/** The whole grid in one innerHTML write — one reflow instead of N. */
export function renderProducts(container: HTMLElement, list: readonly Product[]): void {
  container.innerHTML = list.map(productCardHTML).join('');
}

/* --- Loading / empty / error states ------------------------------------- */

/** Grey boxes with the same shape as a card, so the layout never jumps. */
export function skeletonGridHTML(count = 8): string {
  return Array.from({ length: count }, () => `
    <li>
      <article class="product-card skeleton-card" aria-hidden="true">
        <div class="skeleton skeleton--media"></div>
        <div class="skeleton skeleton--line skeleton--short"></div>
        <div class="skeleton skeleton--line"></div>
        <div class="skeleton skeleton--line skeleton--short"></div>
        <div class="skeleton skeleton--btn"></div>
      </article>
    </li>`).join('');
}

export interface StateOptions {
  title: string;
  message: string;
  /** Trusted markup (a button or a link we wrote), NOT escaped. */
  action?: string;
  variant?: 'empty' | 'error';
}

export function stateHTML({ title, message, action = '', variant = 'empty' }: StateOptions): string {
  return `
    <div class="state state--${variant}" role="${variant === 'error' ? 'alert' : 'status'}">
      <h3 class="state__title">${escapeHTML(title)}</h3>
      <p class="state__message">${escapeHTML(message)}</p>
      ${action}
    </div>`;
}

/* --- Header: cart badge + theme ----------------------------------------- */

export const plural = (n: number, word: string): string => `${n} ${word}${n === 1 ? '' : 's'}`;

/** Reads the cart and writes the number on the header icon. */
export function updateCartBadge(): void {
  const count = getCartCount(loadCart());
  document.querySelectorAll('.cart-link').forEach((link) => {
    const badge = $maybe('.badge', HTMLElement, link);
    const label = $maybe('.visually-hidden', HTMLElement, link);
    if (badge) {
      badge.textContent = String(count); // textContent wants a string, not a number
      badge.hidden = count === 0;
    }
    if (label) label.textContent = `Cart, ${plural(count, 'item')}`;
  });
}

const THEME_KEY = 'shoplite.theme';
type Theme = 'dark' | 'light';

/** Same checkbox and CSS as module 1 — JS only remembers the state. */
export function initTheme(): void {
  const toggle = $maybe('#theme-toggle', HTMLInputElement);
  if (!toggle) return;

  const saved = readString(THEME_KEY);
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  toggle.checked = saved === 'dark' || saved === 'light' ? saved === 'dark' : prefersDark;

  toggle.addEventListener('change', () => {
    const theme: Theme = toggle.checked ? 'dark' : 'light';
    writeString(THEME_KEY, theme); // false = not remembered, the page still switches
  });
}

/* --- Category nav ------------------------------------------------------- */

const CATEGORY_KEY = 'shoplite.categories';

const DEFAULT_CATEGORIES: readonly string[] = [
  'beauty',
  'fragrances',
  'furniture',
  'groceries',
  'laptops',
  'smartphones',
  'sunglasses',
  'tablets',
];

export function cacheCategories(slugs: readonly string[]): void {
  writeJSON(CATEGORY_KEY, slugs);
}

export function cachedCategories(): readonly string[] {
  const saved = readJSON(CATEGORY_KEY);
  return isStringArray(saved) && saved.length > 0 ? saved : DEFAULT_CATEGORIES;
}

export function renderCategoryNav(slugs: readonly string[] = cachedCategories(), active = 'all'): void {
  const navList = $maybe('.nav-list', HTMLUListElement);
  if (!navList) return;

  navList.innerHTML = ['all', ...slugs]
    .map(
      (slug) => `
        <li>
          <a class="nav-link" href="index.html?category=${encodeURIComponent(slug)}"
             data-category="${escapeHTML(slug)}">${escapeHTML(labelOf(slug))}</a>
        </li>`
    )
    .join('');

  markActiveCategory(active);
}

/** Marks the nav tab matching `category` as the current one. */
export function markActiveCategory(category = 'all'): void {
  document.querySelectorAll('.nav-link').forEach((link) => {
    if (!(link instanceof HTMLElement)) return; // Element has no .dataset
    const isActive = (link.dataset.category ?? 'all') === category;
    link.classList.toggle('nav-link--active', isActive);
    if (isActive) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
}

/** A short confirmation after adding to the cart. */
let toastTimer: number | undefined;

export function toast(message: string): void {
  let host = $maybe('.toast', HTMLOutputElement);
  if (!host) {
    host = document.createElement('output');
    host.className = 'toast';
    host.setAttribute('role', 'status');
    document.body.append(host);
  }
  host.textContent = message;
  host.classList.add('toast--visible');

  window.clearTimeout(toastTimer);
  const shown = host; // a const, so the callback below sees a non-null element
  toastTimer = window.setTimeout(() => shown.classList.remove('toast--visible'), 2200);
}

interface HeaderOptions {
  categories?: boolean;
  active?: string;
}

/** Wires the header once: theme, badge, and live badge updates. */
export function mountHeader({ categories = true, active = 'all' }: HeaderOptions = {}): void {
  initTheme();
  updateCartBadge();
  if (categories) renderCategoryNav(cachedCategories(), active);
  window.addEventListener('cart:change', updateCartBadge);
  // Fired when ANOTHER tab writes to localStorage — keeps two tabs in sync.
  window.addEventListener('storage', updateCartBadge);
}
