import { $, clearLog, log, renderExpectedErrors } from '../shared/lab.ts';
import source from './main.ts?raw';

interface Product {
  readonly id: number;
  title: string;
  price: number;
  category: string;
  thumbnail: string;
}

interface ProductPage {
  products: Product[];
  total: number;
  skip: number;
  limit: number;
}

/** The shape the course asks for, and that v3-ts/src/types.ts uses. */
type FetchState<T> = {
  status: 'idle' | 'loading' | 'error' | 'success';
  data?: T;
  error?: string;
};

const BASE = 'https://dummyjson.com';
const FIELDS = 'id,title,price,category,thumbnail';

/* ---------------------------------------------------------------------------
   1. One generic helper for every endpoint
   ------------------------------------------------------------------------ */

async function getJSON<T>(url: string, timeout = 8000): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`Request failed: ${res.status} ${res.statusText}`);
    // res.json() is Promise<any>. `as T` is a PROMISE to the compiler, not a
    // check: nothing verifies the body really is a T. Lab 2.3 fixes that.
    return (await res.json()) as T;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error(`Timed out after ${timeout} ms`);
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

// Every async function returns a Promise — the annotation says of what.
async function getProducts(limit = 6): Promise<Product[]> {
  const page = await getJSON<ProductPage>(`${BASE}/products?limit=${limit}&select=${FIELDS}`);
  return page.products;
}

async function getProduct(id: number): Promise<Product> {
  return getJSON<Product>(`${BASE}/products/${id}?select=${FIELDS}`);
}

// @ts-expect-error TS1064 The return type of an async function or method must be the global Promise<T> type. Did you mean to write 'Promise<Product[]>'?
async function noPromise(): Product[] { return []; } // fix: async function noPromise(): Promise<Product[]>

// @ts-expect-error TS2740 Type 'Promise<Product[]>' is missing the following properties from type 'Product[]': length, pop, push, concat, and 35 more.
const forgotAwait = (): Product[] => getProducts(); // fix: async (): Promise<Product[]> => await getProducts()

// @ts-expect-error TS2339 Property 'title' does not exist on type 'Promise<Product>'.
const titleTooSoon = () => getProduct(1).title; // fix: (await getProduct(1)).title

/* ---------------------------------------------------------------------------
   2. Turning success AND failure into a value: FetchState<T>
   ------------------------------------------------------------------------ */

async function toFetchState<T>(request: Promise<T>): Promise<FetchState<T>> {
  try {
    return { status: 'success', data: await request };
  } catch (error) {
    return { status: 'error', error: error instanceof Error ? error.message : String(error) };
  }
}

// FetchState is loose: `data?` is optional in EVERY state, so even inside
// the 'success' branch the compiler cannot promise it is there.
function countLoose(state: FetchState<Product[]>): number {
  if (state.status !== 'success') return 0;
  // @ts-expect-error TS18048 'state.data' is possibly 'undefined'.
  return state.data.length; // fix: return state.data?.length ?? 0;
}

// The stricter alternative: a discriminated union. Each status carries
// exactly its own fields, so narrowing on status narrows the data too.
type RemoteData<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; error: string }
  | { status: 'success'; data: T };

function countStrict(state: RemoteData<Product[]>): number {
  return state.status === 'success' ? state.data.length : 0; // no ?. needed
}

/* ---------------------------------------------------------------------------
   3. The screen: one render per status
   ------------------------------------------------------------------------ */

const view = $('#view', HTMLDivElement);

const escape = (text: unknown): string =>
  String(text).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

function render(state: FetchState<Product[]>): void {
  switch (state.status) {
    case 'idle':
      view.innerHTML = '<p class="note">Pick a request above.</p>';
      return;
    case 'loading':
      view.innerHTML = '<p class="note">Loading…</p>';
      return;
    case 'error':
      view.innerHTML = `<p class="bad"><strong>Could not load.</strong> ${escape(state.error ?? 'Unknown error')}</p>`;
      return;
    case 'success': {
      const list = state.data ?? [];
      view.innerHTML = `
        <p class="ok">${list.length} product(s)</p>
        <ul>${list.map((p) => `<li>#${escape(p.id)} ${escape(p.title)} — $${escape(p.price)} <span class="note">(${escape(p.category)})</span></li>`).join('')}</ul>`;
    }
  }
}

type Case = 'list' | 'one' | '404' | 'offline' | 'timeout' | 'shape';

const requests: Record<Case, () => Promise<Product[]>> = {
  list: () => getProducts(6),
  one: async () => [await getProduct(1)],
  404: async () => [await getProduct(99999)],
  offline: () => getJSON<Product[]>('https://dummyjson.invalid/products'),
  timeout: async () => (await getJSON<ProductPage>(`${BASE}/products?limit=3&delay=3000`, 1000)).products,
  // A real endpoint returning users, typed as products: `as T` believes it.
  shape: async () => (await getJSON<ProductPage>(`${BASE}/users?limit=3&select=firstName,age`)).products ?? [],
};

function isCase(value: string | undefined): value is Case {
  return value !== undefined && value in requests;
}

async function run(kind: Case): Promise<void> {
  clearLog();
  let state: FetchState<Product[]> = { status: 'loading' };
  log('state →', state);
  render(state);

  state = await toFetchState(requests[kind]());
  log('state →', { ...state, data: state.data && `[${state.data.length} products]` });
  log('countLoose =', countLoose(state));
  if (kind === 'shape') {
    log('⚠ getJSON<ProductPage> "succeeded" on /users: body.products is', state.data, '— the type lied, nothing checked it.');
  }
  render(state);
}

$('#cases', HTMLDivElement).addEventListener('click', (event) => {
  const { target } = event;
  if (!(target instanceof HTMLButtonElement)) return;
  const kind = target.dataset.case;
  if (isCase(kind)) void run(kind);
});

render({ status: 'idle' });
log('countStrict({ status: "success", data: [] }) =', countStrict({ status: 'success', data: [] }));
void noPromise;
void forgotAwait;
void titleTooSoon;
renderExpectedErrors(source);
