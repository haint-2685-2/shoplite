import { heading, log, renderExpectedErrors, tryRun } from '../shared/lab.ts';
import source from './main.ts?raw';

/* ---------------------------------------------------------------------------
   1. The primitive types, written out in full
   ------------------------------------------------------------------------ */

let shopName: string = 'ShopLite';
let price: number = 19.99; // one number type: no int / float / double
let inStock: boolean = true;
let coupon: null = null;
let note: undefined = undefined;

// @ts-expect-error TS2322 Type 'string' is not assignable to type 'number'.
price = '19.99'; // fix: price = 19.99;

// @ts-expect-error TS2322 Type 'string' is not assignable to type 'boolean'.
inStock = 'yes'; // fix: inStock = true;

// @ts-expect-error TS2322 Type 'number' is not assignable to type 'string'.
shopName = 42; // fix: shopName = String(42);

// @ts-expect-error TS2322 Type '"SAVE10"' is not assignable to type 'null'.
coupon = 'SAVE10'; // fix: let coupon: string | null = null;

/* ---------------------------------------------------------------------------
   2. Arrays and tuples
   ------------------------------------------------------------------------ */

const prices: number[] = [9.99, 19.99, 46];
const tags: Array<string> = ['new', 'sale']; // same thing, generic spelling

// A tuple: fixed length, and a type PER POSITION.
const cartLine: [title: string, qty: number] = ['Kite 68 Keyboard', 2];

// @ts-expect-error TS2345 Argument of type 'string' is not assignable to parameter of type 'number'.
prices.push('free'); // fix: prices.push(0);

// @ts-expect-error TS2322 Type 'number' is not assignable to type 'string'.
const swapped: [string, number] = [2, 'Kite 68 Keyboard']; // fix: ['Kite 68 Keyboard', 2]

// @ts-expect-error TS2322 Type '[string, number, number]' is not assignable to type '[string, number]'.
const tooLong: [string, number] = ['Mouse', 1, 2]; // fix: ['Mouse', 1]

/* ---------------------------------------------------------------------------
   3. enum — and why the Vite template forbids it by default
   ------------------------------------------------------------------------ */

enum Currency {
  USD = 'USD',
  VND = 'VND',
}

// @ts-expect-error TS2322 Type '"USD"' is not assignable to type 'Currency'.
const fromString: Currency = 'USD'; // fix: const fromString = Currency.USD;

// The erasable alternative v3-ts uses: a plain object + a union type.
const CURRENCY = { USD: 'USD', VND: 'VND' } as const;
type CurrencyCode = (typeof CURRENCY)[keyof typeof CURRENCY]; // 'USD' | 'VND'
const code: CurrencyCode = 'VND'; // a plain string literal is fine here

/* ---------------------------------------------------------------------------
   4. Inference: let TypeScript write the obvious types
   ------------------------------------------------------------------------ */

let count = 3; //                      number
const label = 'sale'; //               'sale' (const -> the literal itself)
const ratings = [4.5, 4.8]; //         number[]
const mixed = [1, 'two']; //           (string | number)[]
const product = { id: 1, title: 'Mouse', price: 23.6 }; // { id: number; title: string; price: number }

// @ts-expect-error TS2322 Type 'string' is not assignable to type 'number'.
count = 'three'; // fix: count = 3;

// @ts-expect-error TS2551 Property 'prise' does not exist on type '{ id: number; title: string; price: number; }'. Did you mean 'price'?
product.prise = 10; // fix: product.price = 10;

// Redundant annotations: every one of these types is already inferred...
const totalVerbose: number = prices.reduce((sum: number, p: number): number => sum + p, 0);
// ...so write the same line without them. Hover `total` in VS Code: still number.
const total = prices.reduce((sum, p) => sum + p, 0);

// Where annotations DO belong: a variable declared now, assigned later.
let discount: number;
discount = 0.1;

/* ---------------------------------------------------------------------------
   5. any: the off switch
   ------------------------------------------------------------------------ */

let loose: any = 'hello';
loose = 42; // fine, any accepts everything
const shouted = () => loose.toUpperCase(); // fine too... until it runs

/* --- Runtime ------------------------------------------------------------ */

heading('the lines under @ts-expect-error still ran — the compiler warned, JavaScript did not care');
log('shopName =', shopName, '| price =', price, `(typeof ${typeof price})`, '| inStock =', inStock, '| coupon =', coupon, '| note =', note);
log('prices =', prices, '| tags =', tags, '| cartLine =', cartLine);
log('total =', total, '(totalVerbose =', totalVerbose, ') | discount =', discount);
log('  ↑ prices.push("free") ran, so reduce() switched from adding numbers to gluing strings.');
log('swapped =', swapped, '| tooLong =', tooLong, '| fromString =', fromString, '| label =', label, '| mixed =', mixed);

heading('enum vs as const');
log('Currency.USD =', Currency.USD, '— an enum IS a runtime object:', Currency);
log('CURRENCY =', CURRENCY, '| code =', code, '— same object, but the type is erasable');

heading('any compiles, then crashes');
tryRun('loose.toUpperCase()', shouted);

renderExpectedErrors(source);
