/* ==========================================================================
   detail.js — one product, picked by ?id= in the URL (product.html)
   --------------------------------------------------------------------------
   The id comes from the query string, so the same HTML file serves every
   product. Related items need the category, which only the first response
   knows — that is why the second request waits for the first one.
   ========================================================================== */

import { fetchByCategory, fetchProduct } from './api.js';
import { products as fallbackProducts } from './data.js';
import { findById } from './products.js';
import { addToCart } from './cart.js';
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
} from './ui.js';

const root = document.querySelector('#product-root');
const relatedSection = document.querySelector('#related');
const relatedGrid = document.querySelector('#related-grid');
const breadcrumb = document.querySelector('#breadcrumb');

const id = new URLSearchParams(location.search).get('id');

let current = null; // the product on screen, read by the add-to-cart handler
let related = [];

/* --- Templates ---------------------------------------------------------- */

function galleryHTML({ title, images = [], thumbnail }) {
  const shots = (images.length ? images : [thumbnail]).slice(0, 4);
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
      <img class="gallery__main" id="gallery-main" src="${escapeHTML(shots[0] ?? '')}"
           width="900" height="675" alt="${escapeHTML(title)}">
      <ul class="gallery__thumbs">${thumbs}</ul>
    </div>`;
}

function stockHTML({ stock = 0 }) {
  if (stock <= 0) return '<p class="stock stock--out">Out of stock</p>';
  if (stock <= 15) return `<p class="stock">Only ${stock} left in stock</p>`;
  return `<p class="stock">${stock} in stock</p>`;
}

function detailHTML(product) {
  const {
    title,
    category,
    brand,
    rating = 0,
    stock = 0,
    description = '',
    discountPercentage = 0,
  } = product;

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
        ${priceHTML(product, 'price--lg').replace('</p>', `${flag}</p>`)}
        ${stockHTML(product)}
        <p>${escapeHTML(description)}</p>

        <div class="buy-row">
          <div class="qty">
            <button type="button" data-action="dec" aria-label="Decrease quantity">−</button>
            <label class="visually-hidden" for="qty-detail">Quantity</label>
            <input id="qty-detail" type="number" value="1" min="1" max="${Math.max(stock, 1)}">
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

function renderBreadcrumb(product) {
  breadcrumb.innerHTML = product
    ? `
      <li><a href="index.html">Home</a></li>
      <li><a href="index.html?category=${encodeURIComponent(product.category)}">${escapeHTML(labelOf(product.category))}</a></li>
      <li>${escapeHTML(product.title)}</li>`
    : '<li><a href="index.html">Home</a></li><li>Product</li>';
}

/* --- Events -------------------------------------------------------------
   Both listeners sit on containers that are never replaced, so they keep
   working after every re-render. The buttons inside them do not exist yet
   when these lines run — that is the whole point of delegation.
   ----------------------------------------------------------------------- */

root.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action], button[data-src]');
  if (!button) return;

  const qtyInput = root.querySelector('#qty-detail');

  if (button.dataset.src) {
    root.querySelector('#gallery-main').src = button.dataset.src;
    return;
  }
  if (button.dataset.action === 'inc') {
    qtyInput.value = Math.min(Number(qtyInput.value) + 1, Number(qtyInput.max) || 99);
    return;
  }
  if (button.dataset.action === 'dec') {
    qtyInput.value = Math.max(Number(qtyInput.value) - 1, 1);
    return;
  }
  if (button.dataset.action === 'add-to-cart' && current) {
    addToCart(current, Number(qtyInput?.value) || 1);
    toast(`${current.title} added to your cart`);
  }
});

relatedGrid?.addEventListener('click', (event) => {
  const button = event.target.closest('[data-action="add-to-cart"]');
  if (!button) return;

  const product = related.find((p) => String(p.id) === button.closest('[data-id]').dataset.id);
  if (!product) return;

  addToCart(product);
  toast(`${product.title} added to your cart`);
});

/* --- Boot --------------------------------------------------------------- */

async function loadRelated(product) {
  try {
    const siblings = await fetchByCategory(product.category, 5);
    related = siblings.filter((p) => String(p.id) !== String(product.id)).slice(0, 4);
  } catch {
    related = fallbackProducts
      .filter((p) => p.category === product.category && String(p.id) !== String(product.id))
      .slice(0, 4);
  }

  if (related.length === 0) {
    relatedSection.hidden = true;
    return;
  }
  relatedGrid.innerHTML = related.map(productCardHTML).join('');
}

function renderMissing(message) {
  root.innerHTML = stateHTML({
    variant: 'error',
    title: 'Product unavailable',
    message,
    action: '<a class="btn btn--primary" href="index.html">Back to the catalogue</a>',
  });
  relatedSection.hidden = true;
  renderBreadcrumb(null);
}

async function init() {
  mountHeader();

  if (!id) {
    renderMissing('This page needs an id in the URL, for example product.html?id=1.');
    return;
  }

  // Loading state first, await second — never leave the page blank.
  root.innerHTML =
    '<div class="detail-skeleton"><div class="skeleton skeleton--gallery"></div><div class="skeleton skeleton--panel"></div></div>';
  relatedGrid.innerHTML = skeletonGridHTML(4);

  try {
    current = await fetchProduct(id);
  } catch (error) {
    console.error('[api] product failed:', error);
    current = findById(fallbackProducts, id) ?? null;

    if (!current) {
      renderMissing(`${error.message} It is not in the offline sample data either.`);
      return;
    }
  }

  document.title = `${current.title} — ShopLite`;
  renderBreadcrumb(current);
  root.innerHTML = detailHTML(current);
  await loadRelated(current);
}

init();
