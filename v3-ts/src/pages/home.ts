/* ==========================================================================
   home.ts — the product listing page (index.html)
   --------------------------------------------------------------------------
   Same shape as v2: one piece of state, one render(). The state now has a
   type, so `state.sort = 'cheapest'` is a compile error, and every DOM node
   is looked up through $() — a missing id fails on load, not on first click.
   ========================================================================== */

import { fetchProducts, toFetchState } from '../api.ts';
import { addToCart, loadCart, saveCart } from '../cart.ts';
import { products as fallbackProducts } from '../data.ts';
import { $, $maybe, closestTo, idFrom } from '../dom.ts';
import { applyFilters, categoriesOf, findById, isSortOption } from '../products.ts';
import type { ListingFilters, Product } from '../types.ts';
import {
  cacheCategories,
  markActiveCategory,
  mountHeader,
  renderCategoryNav,
  renderProducts,
  skeletonGridHTML,
  stateHTML,
  toast,
} from '../ui.ts';

const grid = $('#product-grid', HTMLUListElement);
const statusBox = $('#grid-status', HTMLDivElement);
const noticeBox = $('#grid-notice', HTMLDivElement);
const countLabel = $('#result-count', HTMLParagraphElement);
const searchInput = $('#search', HTMLInputElement);
const searchForm = $('.search-field', HTMLFormElement);
const sortSelect = $('#sort', HTMLSelectElement);
const navList = $maybe('.nav-list', HTMLUListElement);

/* --- State -------------------------------------------------------------- */

interface HomeState extends ListingFilters {
  all: Product[];
}

const params = new URLSearchParams(location.search);
const sortParam = params.get('sort'); // string | null — could be anything

const state: HomeState = {
  all: [],
  q: params.get('q') ?? '',
  category: params.get('category') ?? 'all',
  sort: isSortOption(sortParam) ? sortParam : 'default',
};

/* --- Render ------------------------------------------------------------- */

function render(): void {
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
function syncURL(): void {
  const next = new URLSearchParams();
  if (state.q) next.set('q', state.q);
  if (state.category !== 'all') next.set('category', state.category);
  if (state.sort !== 'default') next.set('sort', state.sort);

  const query = next.toString();
  history.replaceState(null, '', query ? `?${query}` : location.pathname);
}

function renderCategories(): void {
  const slugs = categoriesOf(state.all);
  cacheCategories(slugs); // product.html and cart.html reuse the same tabs
  renderCategoryNav(slugs, state.category);
}

/* --- Events ------------------------------------------------------------- */

// The typed element is used directly — no `event.target.value` guesswork.
searchInput.addEventListener('input', () => {
  state.q = searchInput.value;
  render();
});

searchForm.addEventListener('submit', (event) => event.preventDefault());

sortSelect.addEventListener('change', () => {
  const { value } = sortSelect; // string, until the guard says otherwise
  state.sort = isSortOption(value) ? value : 'default';
  render();
});

navList?.addEventListener('click', (event) => {
  const link = closestTo(event, '[data-category]', HTMLAnchorElement);
  if (!link) return;
  event.preventDefault();
  state.category = link.dataset.category ?? 'all';
  render();
});

grid.addEventListener('click', (event) => {
  const button = closestTo(event, '[data-action="add-to-cart"]', HTMLButtonElement);
  if (!button) return;

  const id = idFrom(button);
  const product = id === null ? undefined : findById(state.all, id);
  if (!product) return;

  saveCart(addToCart(loadCart(), product));
  toast(`${product.title} added to your cart`);
});

statusBox.addEventListener('click', (event) => {
  if (!closestTo(event, '[data-action="reset"]', HTMLButtonElement)) return;
  state.q = '';
  state.category = 'all';
  state.sort = 'default';
  searchInput.value = '';
  sortSelect.value = 'default';
  render();
});

noticeBox.addEventListener('click', (event) => {
  if (closestTo(event, '[data-action="retry"]', HTMLButtonElement)) location.reload();
});

/* --- Boot --------------------------------------------------------------- */

async function init(): Promise<void> {
  mountHeader({ active: state.category });
  searchInput.value = state.q;
  sortSelect.value = state.sort;

  grid.innerHTML = skeletonGridHTML(8); // loading state BEFORE the await
  countLabel.textContent = 'Loading products…';

  const result = await toFetchState(fetchProducts({ limit: 100 }));

  if (result.status === 'success' && result.data) {
    state.all = result.data;
  } else {
    // The page still has to work offline, so fall back to the built-in data.
    console.error('[api] products failed:', result.error);
    state.all = fallbackProducts;
    noticeBox.innerHTML = stateHTML({
      variant: 'error',
      title: 'Could not reach the store API',
      message: `${result.error ?? 'Unknown error.'} Showing the built-in sample catalogue instead.`,
      action: '<button class="btn btn--outline" type="button" data-action="retry">Try again</button>',
    });
  }

  renderCategories();
  render();
}

void init();
