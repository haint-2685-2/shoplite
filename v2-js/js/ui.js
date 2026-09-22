/* ==========================================================================
   ui.js — shared rendering helpers (module 2, day 2)
   --------------------------------------------------------------------------
   Every function here returns a STRING of HTML or writes into a container.
   Building markup with list.map(item => `...`).join('') is exactly the mental
   model React formalises later: state in, markup out, no manual DOM patching.
   ========================================================================== */

import { getCartCount } from './cart.js';
import { readJSON, writeJSON } from './storage.js';

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export const formatPrice = (n) => money.format(Number(n) || 0);

/**
 * Anything coming from an API ends up inside innerHTML, so it has to be
 * escaped first — a product title containing "<" would otherwise inject
 * markup into the page. This is the one non-negotiable rule of the
 * .map().join('') pattern.
 */
export function escapeHTML(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

/** "home-decoration" -> "Home decoration" */
export function labelOf(slug) {
  const text = String(slug ?? '').replaceAll('-', ' ');
  return text.charAt(0).toUpperCase() + text.slice(1);
}

const STAR = `<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5-5.9-3.2-5.9 3.2 1.2-6.5L2.5 9.4l6.6-.9z"></path></svg>`;

/** Price after discount, plus the original struck through when there is one. */
function priceHTML(product, extraClass = '') {
  const { price, discountPercentage = 0 } = product;
  const now = discountPercentage > 0 ? price * (1 - discountPercentage / 100) : price;
  const was =
    discountPercentage > 0
      ? `<span class="price__was">${formatPrice(price)}</span>`
      : '';
  return `<p class="price ${extraClass}"><span class="price__now">${formatPrice(now)}</span>${was}</p>`;
}

/** One product card. Kept separate so day 3 can reuse it for "similar items". */
export function productCardHTML(product) {
  const { id, title, thumbnail, category, rating = 0, discountPercentage = 0 } = product;
  const flag =
    discountPercentage >= 1
      ? `<span class="product-card__flag">-${Math.round(discountPercentage)}%</span>`
      : '';

  return `
    <li>
      <article class="product-card" data-id="${escapeHTML(id)}">
        <div class="product-card__media">
          <img class="product-card__img" src="${escapeHTML(thumbnail)}" width="440" height="440"
               alt="${escapeHTML(title)}" loading="lazy">
          ${flag}
        </div>
        <span class="tag">${escapeHTML(labelOf(category))}</span>
        <h3 class="product-card__title">
          <a href="product.html?id=${encodeURIComponent(id)}">${escapeHTML(title)}</a>
        </h3>
        <p class="rating">${STAR} ${rating.toFixed(1)}</p>
        ${priceHTML(product)}
        <button class="btn btn--primary" type="button" data-action="add-to-cart">
          Add to cart<span class="visually-hidden"> — ${escapeHTML(title)}</span>
        </button>
      </article>
    </li>`;
}

export { priceHTML };

/** The whole grid in one innerHTML write — one reflow instead of N. */
export function renderProducts(container, list) {
  container.innerHTML = list.map(productCardHTML).join('');
}

/* --- Loading / empty / error states ------------------------------------- */

/** Grey boxes with the same shape as a card, so the layout never jumps. */
export function skeletonGridHTML(count = 8) {
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

export function stateHTML({ title, message, action = '', variant = 'empty' }) {
  return `
    <div class="state state--${variant}" role="${variant === 'error' ? 'alert' : 'status'}">
      <h3 class="state__title">${escapeHTML(title)}</h3>
      <p class="state__message">${escapeHTML(message)}</p>
      ${action}
    </div>`;
}

/* --- Header: cart badge + theme ----------------------------------------- */

/** Reads the cart and writes the number on the header icon. */
export function updateCartBadge() {
  const count = getCartCount();
  document.querySelectorAll('.cart-link').forEach((link) => {
    const badge = link.querySelector('.badge');
    const label = link.querySelector('.visually-hidden');
    if (badge) {
      badge.textContent = count;
      badge.hidden = count === 0;
    }
    if (label) label.textContent = `Cart, ${count} item${count === 1 ? '' : 's'}`;
  });
}

const THEME_KEY = 'shoplite.theme';

/**
 * Module 1 left dark mode to a pure-CSS checkbox, which forgot the choice on
 * every navigation. Same checkbox, same CSS — JS only remembers the state.
 */
export function initTheme() {
  const toggle = document.querySelector('#theme-toggle');
  if (!toggle) return;

  let saved = null;
  try {
    saved = localStorage.getItem(THEME_KEY);
  } catch {
    /* storage blocked: fall back to the system preference */
  }
  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  toggle.checked = saved ? saved === 'dark' : Boolean(prefersDark);

  toggle.addEventListener('change', () => {
    try {
      localStorage.setItem(THEME_KEY, toggle.checked ? 'dark' : 'light');
    } catch {
      /* nothing to do — the page still switches, it just won't be remembered */
    }
  });
}

/* --- Category nav -------------------------------------------------------
   The tabs are whatever the API returns, so they are cached the moment the
   catalogue page learns them. product.html and cart.html then draw the same
   nav without a request of their own; the constant below is only the very
   first-visit fallback.
   ----------------------------------------------------------------------- */

const CATEGORY_KEY = 'shoplite.categories';

const DEFAULT_CATEGORIES = [
  'beauty',
  'fragrances',
  'furniture',
  'groceries',
  'laptops',
  'smartphones',
  'sunglasses',
  'tablets',
];

export function cacheCategories(slugs) {
  writeJSON(CATEGORY_KEY, slugs);
}

export function cachedCategories() {
  const saved = readJSON(CATEGORY_KEY, null);
  return Array.isArray(saved) && saved.length ? saved : DEFAULT_CATEGORIES;
}

export function renderCategoryNav(slugs = cachedCategories(), active = 'all') {
  const navList = document.querySelector('.nav-list');
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
export function markActiveCategory(category = 'all') {
  document.querySelectorAll('.nav-link').forEach((link) => {
    const isActive = (link.dataset.category ?? 'all') === category;
    link.classList.toggle('nav-link--active', isActive);
    if (isActive) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
}

/** A short confirmation after adding to the cart. */
let toastTimer;
export function toast(message) {
  let host = document.querySelector('.toast');
  if (!host) {
    host = document.createElement('output');
    host.className = 'toast';
    host.setAttribute('role', 'status');
    document.body.append(host);
  }
  host.textContent = message;
  host.classList.add('toast--visible');

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => host.classList.remove('toast--visible'), 2200);
}

/** Wires the header once: theme, badge, and live badge updates. */
export function mountHeader({ categories = true, active = 'all' } = {}) {
  initTheme();
  updateCartBadge();
  if (categories) renderCategoryNav(cachedCategories(), active);
  window.addEventListener('cart:change', updateCartBadge);
  // Fired when ANOTHER tab writes to localStorage — keeps two tabs in sync.
  window.addEventListener('storage', updateCartBadge);
}
