/* ==========================================================================
   cart-page.ts — the cart screen (cart.html)
   --------------------------------------------------------------------------
   localStorage is still the state. Every action is now spelled out as
       render(saveCart(operation(loadCart(), ...)))
   read -> pure change -> write -> draw. The cart functions never touch
   storage themselves, which is why they are trivially type-checked.
   ========================================================================== */

import {
  changeQty,
  getCartCount,
  getCartTotal,
  getLineTotal,
  loadCart,
  removeFromCart,
  saveCart,
  updateQty,
} from '../cart.ts';
import { $, closestTo, idFrom } from '../dom.ts';
import type { CartItem } from '../types.ts';
import { escapeHTML, formatPrice, labelOf, mountHeader, plural, stateHTML } from '../ui.ts';

const itemsBox = $('#cart-items', HTMLDivElement);
const summaryBox = $('#cart-summary', HTMLElement);
const layout = $('#cart-layout', HTMLDivElement);
const headline = $('#cart-count', HTMLParagraphElement);

const FREE_SHIPPING_OVER = 100;
const SHIPPING_FEE = 4.99;

/* --- Templates ---------------------------------------------------------- */

function lineHTML(line: CartItem): string {
  const { id, title, price, thumbnail, category, quantity } = line;
  return `
    <article class="cart-item" data-id="${id}">
      <img class="cart-item__img" src="${escapeHTML(thumbnail)}" width="200" height="200"
           alt="${escapeHTML(title)}" loading="lazy">
      <div class="cart-item__info">
        <h3 class="cart-item__title">
          <a href="product.html?id=${id}">${escapeHTML(title)}</a>
        </h3>
        <p class="cart-item__meta">${escapeHTML(labelOf(category))} · ${formatPrice(price)} each</p>
      </div>
      <div class="qty cart-item__qty">
        <button type="button" data-action="dec" aria-label="Decrease quantity of ${escapeHTML(title)}">−</button>
        <label class="visually-hidden" for="qty-${id}">Quantity of ${escapeHTML(title)}</label>
        <input id="qty-${id}" type="number" value="${quantity}" min="1" max="99" data-action="set">
        <button type="button" data-action="inc" aria-label="Increase quantity of ${escapeHTML(title)}">+</button>
      </div>
      <p class="cart-item__price">${formatPrice(getLineTotal(line))}</p>
      <button class="btn btn--icon cart-item__remove" type="button" data-action="remove">
        <span class="visually-hidden">Remove ${escapeHTML(title)} from cart</span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true">
          <path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13M10 11v6M14 11v6"></path>
        </svg>
      </button>
    </article>`;
}

function summaryHTML(cart: readonly CartItem[]): string {
  const subtotal = getCartTotal(cart);
  const count = getCartCount(cart);
  const shipping = subtotal >= FREE_SHIPPING_OVER ? 0 : SHIPPING_FEE;
  const missing = FREE_SHIPPING_OVER - subtotal;

  return `
    <h2 id="summary-title">Order summary</h2>
    <div>
      <p class="summary__row">
        <span>Subtotal (${plural(count, 'item')})</span><span>${formatPrice(subtotal)}</span>
      </p>
      <p class="summary__row">
        <span>Shipping</span><span>${shipping === 0 ? 'Free' : formatPrice(shipping)}</span>
      </p>
      <p class="summary__row summary__row--total">
        <span>Total</span><span>${formatPrice(subtotal + shipping)}</span>
      </p>
    </div>
    ${
      shipping === 0
        ? '<p class="note">Shipping is on us for this order.</p>'
        : `<p class="note">Add ${formatPrice(missing)} more for free shipping.</p>`
    }
    <button class="btn btn--primary btn--lg btn--block" type="button" data-action="checkout">Checkout</button>
    <button class="btn btn--outline btn--block" type="button" data-action="clear">Empty the cart</button>
    <p class="note">A learning project — the checkout button only clears the cart.</p>`;
}

/* --- Render ------------------------------------------------------------- */

function render(cart: readonly CartItem[] = loadCart()): void {
  headline.textContent =
    cart.length === 0 ? 'Your cart is empty' : `${plural(getCartCount(cart), 'item')} in your cart`;

  if (cart.length === 0) {
    layout.classList.add('cart-layout--empty');
    summaryBox.hidden = true;
    itemsBox.innerHTML = stateHTML({
      title: 'Nothing here yet',
      message: 'Products you add from the catalogue show up on this page and survive a reload.',
      action: '<a class="btn btn--primary" href="index.html">Browse products</a>',
    });
    return;
  }

  layout.classList.remove('cart-layout--empty');
  summaryBox.hidden = false;
  itemsBox.innerHTML = cart.map(lineHTML).join('');
  summaryBox.innerHTML = summaryHTML(cart);
}

/* --- Events: delegated listeners for the entire page -------------------- */

itemsBox.addEventListener('click', (event) => {
  const button = closestTo(event, 'button[data-action]', HTMLButtonElement);
  const id = button ? idFrom(button) : null;
  if (!button || id === null) return;

  const cart = loadCart();
  switch (button.dataset.action) {
    case 'inc':
      render(saveCart(changeQty(cart, id, 1)));
      break;
    case 'dec':
      render(saveCart(changeQty(cart, id, -1)));
      break;
    case 'remove':
      render(saveCart(removeFromCart(cart, id)));
      break;
  }
});

// 'change' rather than 'input': typing "1" on the way to "12" would otherwise
// drop the line the moment the field is momentarily empty.
itemsBox.addEventListener('change', (event) => {
  const field = closestTo(event, 'input[data-action="set"]', HTMLInputElement);
  const id = field ? idFrom(field) : null;
  if (!field || id === null) return;
  render(saveCart(updateQty(loadCart(), id, field.valueAsNumber)));
});

summaryBox.addEventListener('click', (event) => {
  const button = closestTo(event, 'button[data-action]', HTMLButtonElement);
  if (!button) return;

  if (button.dataset.action === 'clear') render(saveCart([]));
  if (button.dataset.action === 'checkout') {
    render(saveCart([]));
    itemsBox.innerHTML = stateHTML({
      title: 'Order placed 🎉',
      message: 'Nothing was really bought — the cart has been emptied so you can try again.',
      action: '<a class="btn btn--primary" href="index.html">Keep shopping</a>',
    });
  }
});

// Another tab changed the cart: re-render instead of showing stale numbers.
window.addEventListener('storage', () => render());

mountHeader();
render();
