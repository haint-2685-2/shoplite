import { heading, log, renderExpectedErrors, tryRun } from '../shared/lab.ts';
import source from './main.ts?raw';

interface Product {
  readonly id: number;
  title: string;
  price: number;
  category: string;
}

interface CartItem extends Product {
  quantity: number;
}

const products: Product[] = [
  { id: 1, title: 'Aura X2 Headphones', price: 99.99, category: 'audio' },
  { id: 3, title: 'Zenbook Air 14', price: 860, category: 'laptops' },
  { id: 6, title: 'Glide M2 Mouse', price: 23.6, category: 'accessories' },
];
const cart: CartItem[] = [{ ...products[2]!, quantity: 2 }];
const prices = [9.99, 19.99, 46];

/* ---------------------------------------------------------------------------
   1. identity and getFirst: T is whatever the caller passes in
   ------------------------------------------------------------------------ */

function identity<T>(x: T): T {
  return x;
}

function getFirst<T>(arr: readonly T[]): T | undefined {
  return arr[0]; // with noUncheckedIndexedAccess this is already T | undefined
}

const same = identity('ShopLite'); //    T = string   (inferred, no <string> needed)
const firstProduct = getFirst(products); // T = Product → Product | undefined
const firstPrice = getFirst(prices); //     T = number  → number | undefined
const explicit = getFirst<string>(['a']); // T given by hand — rarely needed

// @ts-expect-error TS2551 Property 'prise' does not exist on type 'Product'. Did you mean 'price'?
const typo = firstProduct?.prise; // fix: firstProduct?.price

// @ts-expect-error TS2551 Property 'toFixed' does not exist on type 'string'. Did you mean 'fixed'?
const wrongMethod = () => getFirst(['a', 'b'])?.toFixed(2); // fix: .toUpperCase() — (String.prototype.fixed is a 1995 HTML helper)

/* ---------------------------------------------------------------------------
   2. The same function with any: it compiles, and it lies
   ------------------------------------------------------------------------ */

function getFirstAny(arr: any[]): any {
  return arr[0];
}

const anyProduct = getFirstAny(products); // any — the Product type is lost
const anyTypo = () => anyProduct.prise.toFixed(2); // no error... until it runs

/* ---------------------------------------------------------------------------
   3. Constraints: T extends { id: number }
   ------------------------------------------------------------------------ */

// Works for Product[], CartItem[], anything with a numeric id — and the
// return type is the SAME type that went in, not a generic "object".
function findById<T extends { id: number }>(list: readonly T[], id: number): T | undefined {
  return list.find((item) => item.id === id);
}

const cartLine = findById(cart, 6); // CartItem | undefined → .quantity is available
const quantity = cartLine?.quantity ?? 0;

// @ts-expect-error TS2322 Type 'string' is not assignable to type '{ id: number; }'.
findById(['a', 'b'], 1); // fix: pass a list of objects with an id

/* ---------------------------------------------------------------------------
   4. keyof: a second type parameter that depends on the first
   ------------------------------------------------------------------------ */

function pluck<T, K extends keyof T>(list: readonly T[], key: K): T[K][] {
  return list.map((item) => item[key]);
}

const titles = pluck(products, 'title'); // string[]
const ids = pluck(products, 'id'); //       number[]

// @ts-expect-error TS2345 Argument of type '"prise"' is not assignable to parameter of type 'keyof Product'.
pluck(products, 'prise'); // fix: pluck(products, 'price')

function groupBy<T, K extends PropertyKey>(list: readonly T[], keyOf: (item: T) => K): Record<K, T[]> {
  const groups = {} as Record<K, T[]>; // the one honest cast: it starts empty
  for (const item of list) {
    const key = keyOf(item);
    (groups[key] ??= []).push(item);
  }
  return groups;
}

const byCategory = groupBy(products, (p) => p.category); // Record<string, Product[]>

/* ---------------------------------------------------------------------------
   5. Generic types: you have been using them all along
   ------------------------------------------------------------------------ */

interface Box<T> {
  value: T;
  updatedAt: Date;
}

const boxedCart: Box<CartItem[]> = { value: cart, updatedAt: new Date(0) };
const list: Array<Product> = products; //               same as Product[]
const pending: Promise<Product[]> = Promise.resolve(products);
const index: Map<number, Product> = new Map(products.map((p) => [p.id, p]));

// @ts-expect-error TS2322 Type 'string' is not assignable to type 'number'.
const badBox: Box<number> = { value: '46', updatedAt: new Date() }; // fix: value: 46

/* --- Runtime ------------------------------------------------------------ */

heading('generic calls keep the type');
log('identity("ShopLite") =', same);
log('getFirst(products) =', firstProduct);
log('getFirst(prices) =', firstPrice, '| getFirst<string>(["a"]) =', explicit);
log('getFirst([]) =', String(getFirst([])), '← why the return type says | undefined');

heading('any loses it');
log('getFirstAny(products) =', anyProduct, '← looks the same...');
tryRun('anyProduct.prise.toFixed(2)', anyTypo);
tryRun('typo (the checked version)', () => typo);

heading('constraints and keyof');
log('findById(cart, 6)?.quantity =', quantity);
log('pluck(products, "title") =', titles);
log('pluck(products, "id") =', ids);
log('groupBy(products, p => p.category) =', Object.fromEntries(Object.entries(byCategory).map(([k, v]) => [k, v.map((p) => p.id)])));

heading('generic types');
log('boxedCart.value.length =', boxedCart.value.length, '| list.length =', list.length, '| index.get(3)?.title =', index.get(3)?.title);
void pending.then((resolved) => log('await pending → length', resolved.length));
tryRun('getFirst(["a", "b"])?.toFixed(2)', wrongMethod);
void badBox;

renderExpectedErrors(source);
