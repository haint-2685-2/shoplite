import { $, heading, log, renderExpectedErrors, tryRun } from '../shared/lab.ts';
import source from './main.ts?raw';

interface CartItem {
  readonly id: number;
  title: string;
  price: number;
  quantity: number;
}

/* ---------------------------------------------------------------------------
   strictNullChecks — null and undefined are their own types
   The biggest one: without it, every value might secretly be null.
   ------------------------------------------------------------------------ */

// querySelector returns Element | null: the element may not exist.
// @ts-expect-error TS2531 Object is possibly 'null'.
const missingCheck = () => document.querySelector('#status').textContent; // fix: document.querySelector('#status')?.textContent ?? ''

// localStorage.getItem returns string | null: the key may not be set.
// @ts-expect-error TS2345 Argument of type 'string | null' is not assignable to parameter of type 'string'.
const parseCart = () => JSON.parse(localStorage.getItem('lab.cart')); // fix: JSON.parse(localStorage.getItem('lab.cart') ?? '[]')

// find() returns T | undefined: nothing may match.
const cart: CartItem[] = [{ id: 1, title: 'Aura X2', price: 99.99, quantity: 1 }];
// @ts-expect-error TS18048 'line' is possibly 'undefined'.
const qtyOf = (id: number) => { const line = cart.find((l) => l.id === id); return line.quantity; }; // fix: return line?.quantity ?? 0;

// The fixed versions, which the compiler accepts without a single `!` or `as`:
function readStatus(): string {
  const el = document.querySelector('#status');
  return el?.textContent ?? '(no #status element)';
}

function readCart(): unknown {
  const raw = localStorage.getItem('lab.cart'); // string | null
  if (raw === null) return []; // narrowed: below this line raw is string
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/* ---------------------------------------------------------------------------
   noImplicitAny — a parameter without a type is an error, not `any`
   ------------------------------------------------------------------------ */

// @ts-expect-error TS7006 Parameter 'item' implicitly has an 'any' type.
function lineTotal(item) { return item.price * item.quantity; } // fix: function lineTotal(item: CartItem): number

/* ---------------------------------------------------------------------------
   useUnknownInCatchVariables — a caught value is unknown: JS can throw anything
   ------------------------------------------------------------------------ */

function risky(): string {
  try {
    throw 'a plain string, not an Error';
  } catch (error) {
    // @ts-expect-error TS18046 'error' is of type 'unknown'.
    const bad = () => error.message; // fix: error instanceof Error ? error.message : String(error)
    return error instanceof Error ? error.message : String(error);
  }
}

/* ---------------------------------------------------------------------------
   strictPropertyInitialization — a class field must be set in the constructor
   ------------------------------------------------------------------------ */

class CartStore {
  // @ts-expect-error TS2564 Property 'items' has no initializer and is not definitely assigned in the constructor.
  items: CartItem[]; // fix: items: CartItem[] = [];

  count(): number {
    return this.items.length;
  }
}

/* ---------------------------------------------------------------------------
   strictFunctionTypes — a callback must accept what it will be given
   ------------------------------------------------------------------------ */

type ClickHandler = (event: MouseEvent) => void;
const onKey = (event: KeyboardEvent): void => void event.key;
// @ts-expect-error TS2322 Type '(event: KeyboardEvent) => void' is not assignable to type 'ClickHandler'.
const handler: ClickHandler = onKey; // fix: (event: MouseEvent) => ... or (event: Event) => ...

/* ---------------------------------------------------------------------------
   noUncheckedIndexedAccess (not part of strict, on in v3-ts) — list[i] may be empty
   ------------------------------------------------------------------------ */

const emptyCart: CartItem[] = [];
// @ts-expect-error TS18048 'first' is possibly 'undefined'.
const firstTitle = () => { const first = emptyCart[0]; return first.title; }; // fix: return emptyCart[0]?.title ?? 'empty';

/* ---------------------------------------------------------------------------
   The escape hatches: `!` and `as` compile — and move the crash to runtime
   ------------------------------------------------------------------------ */

const withBang = () => document.querySelector('#does-not-exist')!.textContent;
const withCast = () => (document.querySelector('#does-not-exist') as HTMLInputElement).value;
const withGuard = () => {
  const el = document.querySelector('#does-not-exist');
  return el instanceof HTMLInputElement ? el.value : '(not found — handled)';
};

/* --- Runtime ------------------------------------------------------------ */

$('#status', HTMLParagraphElement).textContent = 'Ready: every check below ran.';

heading('the unfixed versions, if they had been allowed to run');
tryRun("localStorage.getItem('lab.cart') → JSON.parse(null)", parseCart);
tryRun('qtyOf(99)', () => qtyOf(99));
tryRun('lineTotal({ price: 2 })', () => lineTotal({ price: 2 }));
tryRun('new CartStore().count()', () => new CartStore().count());
tryRun('firstTitle()', firstTitle);

heading('the fixed versions');
log('readStatus() =', readStatus());
log('readCart() =', readCart());
log('risky() =', risky());
log('missingCheck() happens to work here:', missingCheck(), '— the element exists on THIS page');

heading('escape hatches');
tryRun('querySelector(...)!.textContent', withBang);
tryRun('(querySelector(...) as HTMLInputElement).value', withCast);
tryRun('instanceof guard', withGuard);
void handler;

renderExpectedErrors(source);
