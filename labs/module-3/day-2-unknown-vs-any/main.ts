import { $, clearLog, heading, log, renderExpectedErrors } from '../shared/lab.ts';
import source from './main.ts?raw';

interface Product {
  readonly id: number;
  title: string;
  price: number;
  tags: string[];
}

/* ---------------------------------------------------------------------------
   1. What the compiler lets you do with each
   ------------------------------------------------------------------------ */

const fromAny: any = JSON.parse('{"id": 1}');
const fromUnknown: unknown = JSON.parse('{"id": 1}');

// any: every operation is allowed, none is checked.
const anyTitle = () => fromAny.title.toUpperCase(); // compiles, crashes when called

// unknown: nothing is allowed until the value has been narrowed.
// @ts-expect-error TS18046 'fromUnknown' is of type 'unknown'.
const unknownTitle = fromUnknown.title; // fix: check with a type guard first

// @ts-expect-error TS2322 Type 'unknown' is not assignable to type 'string'.
const asText: string = fromUnknown; // fix: typeof fromUnknown === 'string' ? fromUnknown : ''

// any leaks: assigned to a typed variable, it silently becomes that type.
const leaked: Product = fromAny; // no error — this is the "sneaky any"

/* ---------------------------------------------------------------------------
   2. Narrowing unknown, step by step
   ------------------------------------------------------------------------ */

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Every reason `value` is not a Product. An empty list means it is one. */
function problemsWith(value: unknown): string[] {
  if (!isRecord(value)) return [`expected an object, got ${value === null ? 'null' : Array.isArray(value) ? 'an array' : typeof value}`];

  const problems: string[] = [];
  // Inside this function `value` is Record<string, unknown>: fields can be
  // read, but each one is still unknown until it is checked.
  if (typeof value.id !== 'number') problems.push(`id should be a number, got ${typeof value.id}`);
  if (typeof value.title !== 'string') problems.push(`title should be a string, got ${typeof value.title}`);
  if (typeof value.price !== 'number' || !Number.isFinite(value.price)) problems.push(`price should be a number, got ${typeof value.price}`);
  if (!Array.isArray(value.tags) || !value.tags.every((t) => typeof t === 'string')) problems.push('tags should be an array of strings');
  return problems;
}

/** The type guard: a runtime check whose `true` the compiler believes. */
function isProduct(value: unknown): value is Product {
  return problemsWith(value).length === 0;
}

/* ---------------------------------------------------------------------------
   3. The same card rendered both ways
   ------------------------------------------------------------------------ */

function describeAny(data: any): string {
  // Reads fine. Proves nothing.
  return `${data.title.toUpperCase()} — $${data.price.toFixed(2)} [${data.tags.join(', ')}]`;
}

function describeUnknown(data: unknown): string {
  if (!isProduct(data)) {
    // @ts-expect-error TS18046 'data' is of type 'unknown'.
    const early = () => data.title; // fix: only after isProduct(data) returned true
    return `rejected: ${problemsWith(data).join('; ')}`;
  }
  // From here on `data` is Product — autocomplete, checks, the lot.
  return `${data.title.toUpperCase()} — $${data.price.toFixed(2)} [${data.tags.join(', ')}]`;
}

/* ---------------------------------------------------------------------------
   4. The same idea against the real API
   ------------------------------------------------------------------------ */

async function fetchChecked(url: string): Promise<Product> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  const body: unknown = await res.json(); // store as unknown, never as any
  if (!isProduct(body)) throw new Error(`Not a product: ${problemsWith(body).join('; ')}`);
  return body;
}

/* --- Interactive -------------------------------------------------------- */

const presets: Record<string, string> = {
  valid: '{ "id": 1, "title": "Aura X2", "price": 99.99, "tags": ["audio", "sale"] }',
  priceAsString: '{ "id": 2, "title": "Nova 12", "price": "519", "tags": [] }',
  missingTags: '{ "id": 3, "title": "Zenbook Air", "price": 860 }',
  array: '[{ "id": 1 }]',
  nullValue: 'null',
  notJson: '{ id: 1, title: oops }',
};

const input = $('#json', HTMLTextAreaElement);
const presetRow = $('#presets', HTMLDivElement);

function parse(text: string): { ok: true; value: unknown } | { ok: false; error: string } {
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

function compare(): void {
  clearLog();
  const parsed = parse(input.value);
  if (!parsed.ok) {
    log('JSON.parse threw:', parsed.error, '— both versions stop here');
    return;
  }

  heading('with any');
  try {
    log(describeAny(parsed.value));
  } catch (error) {
    log('💥', error);
  }

  heading('with unknown + a type guard');
  log(describeUnknown(parsed.value));
}

presetRow.addEventListener('click', (event) => {
  const { target } = event;
  if (!(target instanceof HTMLButtonElement)) return;
  const text = presets[target.dataset.preset ?? ''];
  if (text === undefined) return; // noUncheckedIndexedAccess: a key may be missing
  input.value = text;
  compare();
});

$('#run', HTMLButtonElement).addEventListener('click', compare);

$('#fetch', HTMLButtonElement).addEventListener('click', async () => {
  clearLog();
  heading('GET /products/1 — validated');
  try {
    // DummyJSON products have id, title, price and tags, so this one passes.
    const product = await fetchChecked('https://dummyjson.com/products/1?select=id,title,price,tags');
    log('ok:', describeUnknown(product));
  } catch (error) {
    log('💥', error);
  }
  heading('GET /users/1 — validated');
  try {
    await fetchChecked('https://dummyjson.com/users/1?select=id,firstName');
  } catch (error) {
    log('rejected at the edge:', error);
  }
});

input.value = presets.valid ?? '';
compare();
void anyTitle;
void unknownTitle;
void asText;
void leaked;
renderExpectedErrors(source);
