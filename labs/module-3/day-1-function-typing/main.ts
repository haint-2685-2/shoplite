import { $, heading, log, renderExpectedErrors } from '../shared/lab.ts';
import source from './main.ts?raw';

interface Product {
  readonly id: number;
  title: string;
  price: number;
  stock: number;
}

const catalogue: Product[] = [
  { id: 1, title: 'Aura X2 Headphones', price: 99.99, stock: 12 },
  { id: 5, title: 'Kite 68 Keyboard', price: 46, stock: 0 },
  { id: 6, title: 'Glide M2 Mouse', price: 23.6, stock: 88 },
];

/* ---------------------------------------------------------------------------
   1. Parameters and return values
   ------------------------------------------------------------------------ */

function lineTotal(price: number, quantity: number): number {
  return price * quantity;
}

// A default value types the parameter by itself: currency is string.
function formatPrice(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

// Optional parameter: `greeting?: string` means string | undefined inside.
function welcome(name: string, greeting?: string): string {
  return `${greeting ?? 'Hello'}, ${name}!`;
}

// Rest parameter: any number of numbers, collected into number[].
function sum(...values: number[]): number {
  return values.reduce((total, n) => total + n, 0);
}

// @ts-expect-error TS2345 Argument of type 'string' is not assignable to parameter of type 'number'.
const fromText = lineTotal('19.99', 2); // fix: lineTotal(Number('19.99'), 2)

// @ts-expect-error TS2554 Expected 2 arguments, but got 1.
const missingArg = lineTotal(19.99); // fix: lineTotal(19.99, 1)

// @ts-expect-error TS2322 Type 'number' is not assignable to type 'string'.
const label: string = lineTotal(19.99, 2); // fix: formatPrice(lineTotal(19.99, 2))

// noImplicitReturns: one path forgot to return.
// @ts-expect-error TS7030 Not all code paths return a value.
function stockLabel(stock: number): string | undefined { // fix: add `return 'In stock';` at the end
  if (stock === 0) return 'Out of stock';
  if (stock < 10) return 'Low stock';
}

/* ---------------------------------------------------------------------------
   2. Function types and callbacks
   ------------------------------------------------------------------------ */

// A function type, named once and reused.
type Predicate = (product: Product) => boolean;
type Formatter = (product: Product) => string;

function filterProducts(list: readonly Product[], keep: Predicate): Product[] {
  return list.filter(keep);
}

// The callback's parameter types come from the signature: `p` needs no annotation.
const inStock = filterProducts(catalogue, (p) => p.stock > 0);

// @ts-expect-error TS2322 Type 'number' is not assignable to type 'boolean'.
const wrongReturn = filterProducts(catalogue, (p) => p.stock); // fix: (p) => p.stock > 0

// @ts-expect-error TS2345 Argument of type '(p: string) => boolean' is not assignable to parameter of type 'Predicate'.
const wrongParam = filterProducts(catalogue, (p: string) => p.length > 3); // fix: (p) => p.title.length > 3

/**
 * A callback that is only called, never asked for a value: `=> void`.
 * Returns a function too — the "unsubscribe" pattern of every event API.
 */
function onEachProduct(
  list: readonly Product[],
  callback: (product: Product, index: number) => void
): () => number {
  list.forEach((product, index) => callback(product, index));
  return () => list.length;
}

// A callback may take FEWER parameters than offered — this is fine.
const visited: string[] = [];
const countOf = onEachProduct(catalogue, (product) => visited.push(product.title));

// @ts-expect-error TS2345 Argument of type '(product: Product, index: number, extra: string) => void' is not assignable to parameter of type '(product: Product, index: number) => void'.
onEachProduct(catalogue, (product: Product, index: number, extra: string) => {}); // fix: drop `extra`

/* ---------------------------------------------------------------------------
   3. A typed callback in real DOM code
   ------------------------------------------------------------------------ */

// A handler map: the keys are fixed, and every value has the same signature.
const formatters: Record<'plain' | 'price' | 'stock', Formatter> = {
  plain: (p) => p.title,
  price: (p) => `${p.title} — ${formatPrice(p.price)}`,
  stock: (p) => `${p.title} — ${stockLabel(p.stock) ?? 'In stock'}`,
};

function isFormatterKey(value: string | undefined): value is keyof typeof formatters {
  return value === 'plain' || value === 'price' || value === 'stock';
}

const list = $('#list', HTMLUListElement);
const picker = $('#formats', HTMLDivElement);

function renderList(format: Formatter): void {
  list.innerHTML = catalogue.map((p) => `<li>${format(p)}</li>`).join('');
}

picker.addEventListener('click', (event: MouseEvent) => {
  const { target } = event;
  if (!(target instanceof HTMLButtonElement)) return;
  const key = target.dataset.format;
  if (isFormatterKey(key)) renderList(formatters[key]);
});

/* --- Runtime ------------------------------------------------------------ */

heading('parameters and returns');
log('lineTotal(19.99, 3) =', lineTotal(19.99, 3));
log('formatPrice(46) =', formatPrice(46), '| formatPrice(46, "EUR") =', formatPrice(46, 'EUR'));
log('welcome("Lan") =', welcome('Lan'), '| welcome("Lan", "Xin chào") =', welcome('Lan', 'Xin chào'));
log('sum(1, 2, 3.5) =', sum(1, 2, 3.5));
log('stockLabel(50) =', String(stockLabel(50)), '← the path TS7030 warned about');

heading('the ignored errors, at runtime');
log('lineTotal("19.99", 2) =', fromText, '← "19.99" * 2 was coerced by JavaScript');
log('lineTotal(19.99) =', missingArg, '← quantity was undefined');
log('label =', label, `(typeof ${typeof label})`);
log('wrongReturn =', wrongReturn.map((p) => p.title), '← stock 0 is falsy, 88 is truthy');
log('wrongParam =', wrongParam, '← p.length on an object is undefined, so nothing matched');

heading('callbacks');
log('inStock =', inStock.map((p) => p.title));
log('visited =', visited, '← push() returns a number, still fine for a => void callback');
log('onEachProduct returned', countOf(), '— its unsubscribe-style function was called');

renderList(formatters.plain);
renderExpectedErrors(source);
