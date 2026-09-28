/* ==========================================================================
   detail.ts — one product, picked by ?id= in the URL (product.html)
   --------------------------------------------------------------------------
   The id arrives as `string | null`. It is parsed into a number once, at
   the edge, so everything after this point works with `number` like the
   Product type says. `current` is `Product | null` — strict mode makes the
   add-to-cart handler check it before use.
   ========================================================================== */

import { errorMessage, fetchByCategory, fetchProduct } from '../api.ts';
import { addToCart, loadCart, MAX_QTY, saveCart } from '../cart.ts';
import { products as fallbackProducts } from '../data.ts';
import { $, $maybe, closestTo, idFrom } from '../dom.ts';
import { findById } from '../products.ts';
import type { Product } from '../types.ts';
import {
  escapeHTML,
  formatPrice,
  labelOf,
  mountHeader,
  priceHTML,
  productCardHTML,
  skeletonGridHTML,
  stateHTML,
  toast,
} from '../ui.ts';

const root = $('#product-root', HTMLElement);
const relatedSection = $('#related', HTMLElement);
const relatedGrid = $('#related-grid', HTMLUListElement);
const breadcrumb = $('#breadcrumb', HTMLOListElement);

/** null for a missing or non-numeric ?id= — handled once in init(). */
function idFromURL(): number | null {
  const raw = new URLSearchParams(location.search).get('id');
  const id = Number(raw);
  return raw !== null && Number.isInteger(id) && id > 0 ? id : null;
}

let current: Product | null = null; // the product on screen
let related: Product[] = [];

/* --- Templates ---------------------------------------------------------- */

function galleryHTML({ title, images, thumbnail }: Product): string {
  const shots = (images.length > 0 ? images : [thumbnail]).slice(0, 4);
  const thumbs = shots
    .map(
      (src, i) => `
        <li>
          <button type="button" data-src="${escapeHTML(src)}">
            <span class="visually-hidden">View image ${i + 1}</span>
            <img src="${escapeHTML(src)}" width="200" height="200" alt="" loading="lazy">
          </button>
        </li>`
    )
    .join('');

  return `
    <div class="gallery">
      <img class="gallery__main" id="gallery-main" src="${escapeHTML(shots[0] ?? thumbnail)}"
           width="900" height="675" alt="${escapeHTML(title)}">
      <ul class="gallery__thumbs">${thumbs}</ul>
    </div>`;
}

function stockHTML({ stock }: Pick<Product, 'stock'>): string {
  if (stock <= 0) return '<p class="stock stock--out">Out of stock</p>';
  if (stock <= 15) return `<p class="stock">Only ${stock} left in stock</p>`;
  return `<p class="stock">${stock} in stock</p>`;
}

function detailHTML(product: Product): string {
  const { title, category, brand, rating, stock, description, discountPercentage } = product;

  const flag =
    discountPercentage >= 1
      ? `<span class="product-card__flag product-card__flag--inline">-${Math.round(discountPercentage)}%</span>`
      : '';

  return `
    <div class="product-detail">
      ${galleryHTML(product)}
      <div class="panel stack">
        <span class="tag">${escapeHTML(labelOf(category))}</span>
        <h1>${escapeHTML(title)}</h1>
        <p class="rating">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5-5.9-3.2-5.9 3.2 1.2-6.5L2.5 9.4l6.6-.9z"></path></svg>
          ${rating.toFixed(1)}${brand ? ` · ${escapeHTML(brand)}` : ''}
        </p>
        ${priceHTML(product, 'price--lg', flag)}
        ${stockHTML(product)}
        <p>${escapeHTML(description)}</p>

        <div class="buy-row">
          <div class="qty">
            <button type="button" data-action="dec" aria-label="Decrease quantity">−</button>
            <label class="visually-hidden" for="qty-detail">Quantity</label>
            <input id="qty-detail" type="number" value="1" min="1" max="${Math.min(Math.max(stock, 1), MAX_QTY)}">
            <button type="button" data-action="inc" aria-label="Increase quantity">+</button>
          </div>
          <button class="btn btn--primary btn--lg" type="button" data-action="add-to-cart"
                  ${stock <= 0 ? 'disabled' : ''}>Add to cart</button>
          <a class="btn btn--outline btn--lg" href="cart.html">Go to cart</a>
        </div>

        <p class="note">Free shipping over ${formatPrice(100)} · 7-day returns</p>
      </div>
    </div>`;
}

function renderBreadcrumb(product: Product | null): void {
  breadcrumb.innerHTML = product
    ? `
      <li><a href="index.html">Home</a></li>
      <li><a href="index.html?category=${encodeURIComponent(product.category)}">${escapeHTML(labelOf(product.category))}</a></li>
      <li>${escapeHTML(product.title)}</li>`
    : '<li><a href="index.html">Home</a></li><li>Product</li>';
}

/* --- Events ------------------------------------------------------------- */

root.addEventListener('click', (event) => {
  const button = closestTo(event, 'button[data-action], button[data-src]', HTMLButtonElement);
  if (!button) return;

  // Rendered after load, so these are optional lookups, not required ones.
  const qtyInput = $maybe('#qty-detail', HTMLInputElement, root);
  const mainImage = $maybe('#gallery-main', HTMLImageElement, root);

  if (button.dataset.src) {
    if (mainImage) mainImage.src = button.dataset.src;
    return;
  }
  if (!qtyInput) return;

  // .value is always a string; valueAsNumber is the typed way to read a number field.
  const qty = Number.isFinite(qtyInput.valueAsNumber) ? qtyInput.valueAsNumber : 1;
  const max = Number(qtyInput.max) || MAX_QTY;

  switch (button.dataset.action) {
    case 'inc':
      qtyInput.value = String(Math.min(qty + 1, max));
      break;
    case 'dec':
      qtyInput.value = String(Math.max(qty - 1, 1));
      break;
    case 'add-to-cart':
      if (!current) return;
      saveCart(addToCart(loadCart(), current, qty));
      toast(`${current.title} added to your cart`);
      break;
  }
});

relatedGrid.addEventListener('click', (event) => {
  const button = closestTo(event, '[data-action="add-to-cart"]', HTMLButtonElement);
  if (!button) return;

  const id = idFrom(button);
  const product = id === null ? undefined : findById(related, id);
  if (!product) return;

  saveCart(addToCart(loadCart(), product));
  toast(`${product.title} added to your cart`);
});

/* --- Boot --------------------------------------------------------------- */

async function loadRelated(product: Product): Promise<void> {
  const isSibling = (p: Product): boolean => p.category === product.category && p.id !== product.id;

  try {
    related = (await fetchByCategory(product.category, 5)).filter(isSibling).slice(0, 4);
  } catch {
    related = fallbackProducts.filter(isSibling).slice(0, 4);
  }

  if (related.length === 0) {
    relatedSection.hidden = true;
    return;
  }
  relatedGrid.innerHTML = related.map(productCardHTML).join('');
}

function renderMissing(message: string): void {
  root.innerHTML = stateHTML({
    variant: 'error',
    title: 'Product unavailable',
    message,
    action: '<a class="btn btn--primary" href="index.html">Back to the catalogue</a>',
  });
  relatedSection.hidden = true;
  renderBreadcrumb(null);
}

async function init(): Promise<void> {
  mountHeader();

  const id = idFromURL();
  if (id === null) {
    renderMissing('This page needs a numeric id in the URL, for example product.html?id=1.');
    return;
  }

  // Loading state first, await second — never leave the page blank.
  root.innerHTML =
    '<div class="detail-skeleton"><div class="skeleton skeleton--gallery"></div><div class="skeleton skeleton--panel"></div></div>';
  relatedGrid.innerHTML = skeletonGridHTML(4);

  let product: Product | undefined;
  try {
    product = await fetchProduct(id);
  } catch (error) {
    console.error('[api] product failed:', error);
    product = findById(fallbackProducts, id);
    if (!product) {
      renderMissing(`${errorMessage(error)} It is not in the offline sample data either.`);
      return;
    }
  }

  current = product;
  document.title = `${product.title} — ShopLite`;
  renderBreadcrumb(product);
  root.innerHTML = detailHTML(product);
  await loadRelated(product);
}

void init();
