import { heading, log, renderExpectedErrors, tryRun } from '../shared/lab.ts';
import source from './main.ts?raw';

/* ---------------------------------------------------------------------------
   1. interface: the shape of an object
   ------------------------------------------------------------------------ */

interface Product {
  readonly id: number; // can be read, never reassigned
  title: string;
  price: number;
  description?: string; // may be missing: string | undefined
}

const mouse: Product = { id: 6, title: 'Glide M2 Wireless Mouse', price: 23.6 };

// @ts-expect-error TS2540 Cannot assign to 'id' because it is a read-only property.
mouse.id = 7; // fix: const copy: Product = { ...mouse, id: 7 };

// @ts-expect-error TS2741 Property 'price' is missing in type '{ id: number; title: string; }' but required in type 'Product'.
const noPrice: Product = { id: 1, title: 'Aura X2' }; // fix: add price: 99.99

// @ts-expect-error TS2561 Object literal may only specify known properties, but 'prise' does not exist in type 'Product'. Did you mean to write 'price'?
const typo: Product = { id: 2, title: 'Nova 12', prise: 519 }; // fix: price: 519

// @ts-expect-error TS18048 'mouse.description' is possibly 'undefined'.
const descLength = () => mouse.description.length; // fix: mouse.description?.length ?? 0

/* ---------------------------------------------------------------------------
   2. extends: build a bigger shape from a smaller one
   ------------------------------------------------------------------------ */

interface DiscountedProduct extends Product {
  discountPercentage: number;
}

interface CartItem extends Product {
  quantity: number;
}

const line: CartItem = { ...mouse, quantity: 2 };
const onSale: DiscountedProduct = { ...mouse, discountPercentage: 8.5 };

// A CartItem IS a Product (it has everything a Product has), so this works:
const asProduct: Product = line;

// @ts-expect-error TS2741 Property 'quantity' is missing in type 'Product' but required in type 'CartItem'.
const asLine: CartItem = mouse; // fix: const asLine: CartItem = { ...mouse, quantity: 1 };

/* ---------------------------------------------------------------------------
   3. Declaration merging: only interfaces can be reopened
   ------------------------------------------------------------------------ */

interface Shopper {
  name: string;
}
interface Shopper {
  email?: string; // merged into the Shopper above
}
const shopper: Shopper = { name: 'Lan', email: 'lan@example.com' };

/*
  A `type` cannot be reopened. With the two lines below, tsc reports
  TS2300 "Duplicate identifier 'Size'" on both — and Vite's parser refuses
  to even transform the file, so they can only live in a comment:

    type Size = { w: number };
    type Size = { h: number };

  Fix: one declaration, type Size = { w: number; h: number };
*/

/* ---------------------------------------------------------------------------
   4. type: for what an interface cannot say
   ------------------------------------------------------------------------ */

type ProductId = number; //                            alias of a primitive
type Status = 'idle' | 'loading' | 'error'; //          union of literals
type Timestamps = { createdAt: Date; updatedAt: Date };
type StoredProduct = Product & Timestamps; //          intersection
type PriceTuple = [amount: number, currency: 'USD' | 'VND']; // tuple
type Formatter = (p: Product) => string; //            function type

const status: Status = 'loading';
const stored: StoredProduct = { ...mouse, createdAt: new Date(0), updatedAt: new Date(0) };
const tuple: PriceTuple = [23.6, 'USD'];
const format: Formatter = (p) => `${p.title} — $${p.price}`;

// @ts-expect-error TS2322 Type '"done"' is not assignable to type 'Status'.
const finished: Status = 'done'; // fix: 'idle' | 'loading' | 'error'

/* --- Runtime ------------------------------------------------------------ */

heading('objects');
log('mouse =', mouse);
log('line (CartItem) =', line);
log('onSale (DiscountedProduct) =', onSale);
log('format(asProduct) =', format(asProduct));
log('shopper (merged interface) =', shopper);
log('stored (intersection) =', stored);
log('status =', status, '| tuple =', tuple);

heading('readonly and ? only exist for the compiler');
log('mouse.id after the "forbidden" assignment =', mouse.id, '← readonly is not Object.freeze()');
tryRun('mouse.description.length', descLength);

renderExpectedErrors(source);
