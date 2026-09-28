import { $, clearLog, heading, log, renderExpectedErrors } from '../shared/lab.ts';
import source from './main.ts?raw';

/* ---------------------------------------------------------------------------
   1. A union of literals, and a switch that narrows it
   ------------------------------------------------------------------------ */

type Status = 'idle' | 'loading' | 'error' | 'success';

function statusLabel(status: Status): string {
  switch (status) {
    case 'idle':
      return 'Nothing requested yet';
    case 'loading':
      return 'Loading products…';
    case 'error':
      return 'Could not load the products';
    case 'success':
      return 'Products loaded';
    default: {
      // Every member is handled, so here `status` has type never.
      // Add 'cancelled' to Status and this line becomes a compile error.
      const unreachable: never = status;
      return unreachable;
    }
  }
}

// @ts-expect-error TS2345 Argument of type '"done"' is not assignable to parameter of type 'Status'.
const wrong = () => statusLabel('done'); // fix: statusLabel('success')

/* ---------------------------------------------------------------------------
   2. The same switch with a branch missing: two ways the compiler notices
   ------------------------------------------------------------------------ */

function withNeverCheck(status: Status): string {
  switch (status) {
    case 'idle':
    case 'loading':
      return 'busy or waiting';
    case 'error':
      return 'failed';
    default: {
      // @ts-expect-error TS2322 Type '"success"' is not assignable to type 'never'.
      const unreachable: never = status; // fix: add `case 'success':` above
      return unreachable;
    }
  }
}

// Without a default, the declared return type does the job instead.
// @ts-expect-error TS2366 Function lacks ending return statement and return type does not include 'undefined'.
function withReturnType(status: Status): string { // fix: add `case 'success': return '…';`
  switch (status) {
    case 'idle':
      return 'waiting';
    case 'loading':
      return 'busy';
    case 'error':
      return 'failed';
  }
}

/* ---------------------------------------------------------------------------
   3. Other ways to narrow: typeof, in, truthiness, discriminant
   ------------------------------------------------------------------------ */

function formatId(id: string | number): string {
  // @ts-expect-error TS2339 Property 'padStart' does not exist on type 'string | number'.
  const bad = () => id.padStart(4, '0'); // fix: narrow with typeof first

  if (typeof id === 'number') return `#${id.toString().padStart(4, '0')}`; // id: number
  return `#${id.padStart(4, '0')}`; // id: string — the only thing left
}

interface Product {
  id: number;
  title: string;
  price: number;
}
interface Category {
  slug: string;
  name: string;
}

function nameOf(item: Product | Category): string {
  return 'title' in item ? item.title : item.name; // `in` narrows to one side
}

// A discriminated union: `status` tells TypeScript which fields exist.
type Load =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; error: string }
  | { status: 'success'; products: Product[] };

function describe(load: Load): string {
  // @ts-expect-error TS2339 Property 'products' does not exist on type 'Load'.
  const early = load.products; // fix: check load.status === 'success' first

  switch (load.status) {
    case 'idle':
      return statusLabel(load.status);
    case 'loading':
      return statusLabel(load.status);
    case 'error':
      return `${statusLabel(load.status)}: ${load.error}`; // .error exists only here
    case 'success':
      return `${load.products.length} products: ${load.products.map((p) => p.title).join(', ')}`;
  }
}

/* --- Interactive -------------------------------------------------------- */

const samples: Record<Status, Load> = {
  idle: { status: 'idle' },
  loading: { status: 'loading' },
  error: { status: 'error', error: 'Request failed: 500 Internal Server Error' },
  success: {
    status: 'success',
    products: [
      { id: 1, title: 'Aura X2', price: 99.99 },
      { id: 6, title: 'Glide M2', price: 23.6 },
    ],
  },
};

const view = $('#view', HTMLParagraphElement);
const buttons = $('#statuses', HTMLDivElement);

function isStatus(value: string | undefined): value is Status {
  return value === 'idle' || value === 'loading' || value === 'error' || value === 'success';
}

function show(status: Status): void {
  view.textContent = describe(samples[status]);
  buttons.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.status === status)));

  clearLog();
  heading(`status = '${status}'`);
  log('statusLabel      →', statusLabel(status));
  log('withNeverCheck   →', withNeverCheck(status));
  log('withReturnType   →', String(withReturnType(status)), status === 'success' ? '← the missing branch: undefined at runtime' : '');
  log('formatId(7)      →', formatId(7), '| formatId("42") →', formatId('42'));
  log('nameOf(...)      →', nameOf({ slug: 'audio', name: 'Audio' }), '/', nameOf({ id: 1, title: 'Aura X2', price: 99.99 }));
}

buttons.addEventListener('click', (event) => {
  const { target } = event;
  if (!(target instanceof HTMLButtonElement)) return;
  const { status } = target.dataset;
  if (isStatus(status)) show(status);
});

show('idle');
void wrong;
renderExpectedErrors(source);
