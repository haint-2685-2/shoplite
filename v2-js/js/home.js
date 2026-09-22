/* ==========================================================================
   home.js — the product listing page (index.html)
   --------------------------------------------------------------------------
   Shape of the page: one piece of state, one render() function. Every event
   updates the state and calls render() again. That single rule is what keeps
   a vanilla-JS page from turning into a pile of manual DOM patches.
   ========================================================================== */

import { fetchProducts } from './api.js';
import { products as fallbackProducts } from './data.js';
import { applyFilters, categoriesOf, findById } from './products.js';
import {
  cacheCategories,
  markActiveCategory,
  mountHeader,
  renderCategoryNav,
  renderProducts,
  skeletonGridHTML,
  stateHTML,
  toast,
} from './ui.js';
import { addToCart } from './cart.js';

const grid = document.querySelector('#product-grid');
const statusBox = document.querySelector('#grid-status');
const noticeBox = document.querySelector('#grid-notice');
const countLabel = document.querySelector('#result-count');
const searchInput = document.querySelector('#search');
const searchForm = document.querySelector('.search-field');
const sortSelect = document.querySelector('#sort');
const navList = document.querySelector('.nav-list');

/* --- State -------------------------------------------------------------- */

const params = new URLSearchParams(location.search);

const state = {
  all: [],
  q: params.get('q') ?? '',
  category: params.get('category') ?? 'all',
  sort: params.get('sort') ?? 'default',
};

/* --- Render ------------------------------------------------------------- */

function render() {
  const visible = applyFilters(state.all, state);

  if (visible.length === 0) {
    grid.innerHTML = '';
    statusBox.innerHTML = stateHTML({
      title: 'No products found',
      message: state.q
        ? `Nothing matches “${state.q}”. Try a shorter keyword or another category.`
        : 'There is nothing in this category yet.',
      action: '<button class="btn btn--outline" type="button" data-action="reset">Clear filters</button>',
    });
  } else {
    statusBox.innerHTML = '';
    renderProducts(grid, visible);
  }

  countLabel.textContent = `Showing ${visible.length} of ${state.all.length} products`;
  markActiveCategory(state.category);
  syncURL();
}

/** Keeps the address bar in step with the filters, so the page is shareable. */
function syncURL() {
  const next = new URLSearchParams();
  if (state.q) next.set('q', state.q);
  if (state.category !== 'all') next.set('category', state.category);
  if (state.sort !== 'default') next.set('sort', state.sort);

  const query = next.toString();
  history.replaceState(null, '', query ? `?${query}` : location.pathname);
}

/** Category tabs come from the data, so the API decides what they are. */
function renderCategories() {
  const slugs = categoriesOf(state.all);
  cacheCategories(slugs); // product.html and cart.html reuse the same tabs
  renderCategoryNav(slugs, state.category);
}

/* --- Events ------------------------------------------------------------- */

// Typing filters in place: no request, no reload — the list is already here.
searchInput?.addEventListener('input', (event) => {
  state.q = event.target.value;
  render();
});

// The header form still points at index.html for the other pages; here the
// page IS index.html, so a submit would only reload what is already rendered.
searchForm?.addEventListener('submit', (event) => event.preventDefault());

sortSelect?.addEventListener('change', (event) => {
  state.sort = event.target.value;
  render();
});

/*
  Event delegation, three times over:
  one listener on the nav for every category tab, one on the grid for every
  "Add to cart" button, one on the status box for the reset button. Cards are
  re-created on every render, so per-button listeners would die with them.
*/
navList?.addEventListener('click', (event) => {
  const link = event.target.closest('[data-category]');
  if (!link) return;
  event.preventDefault();
  state.category = link.dataset.category;
  render();
});

grid?.addEventListener('click', (event) => {
  const button = event.target.closest('[data-action="add-to-cart"]');
  if (!button) return;

  // closest() walks UP from the clicked node until it finds the card.
  const card = button.closest('[data-id]');
  const product = findById(state.all, card.dataset.id);
  if (!product) return;

  addToCart(product);
  toast(`${product.title} added to your cart`);
  console.log('[cart] added', product);
});

statusBox?.addEventListener('click', (event) => {
  if (!event.target.closest('[data-action="reset"]')) return;
  state.q = '';
  state.category = 'all';
  state.sort = 'default';
  if (searchInput) searchInput.value = '';
  if (sortSelect) sortSelect.value = 'default';
  render();
});

/* --- Boot --------------------------------------------------------------- */

async function init() {
  mountHeader({ active: state.category });
  if (searchInput) searchInput.value = state.q;
  if (sortSelect) sortSelect.value = state.sort;

  grid.innerHTML = skeletonGridHTML(8); // loading state BEFORE the await
  countLabel.textContent = 'Loading products…';

  try {
    state.all = await fetchProducts({ limit: 100 });
  } catch (error) {
    // The page still has to work offline, so fall back to the day-1 data.
    console.error('[api] products failed:', error);
    state.all = fallbackProducts;
    noticeBox.innerHTML = stateHTML({
      variant: 'error',
      title: 'Could not reach the store API',
      message: `${error.message} Showing the built-in sample catalogue instead.`,
      action: '<button class="btn btn--outline" type="button" data-action="retry">Try again</button>',
    });
    noticeBox.addEventListener('click', (event) => {
      if (event.target.closest('[data-action="retry"]')) location.reload();
    });
  }

  renderCategories();
  render();
}

init();
