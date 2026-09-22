/* ==========================================================================
   cart-page.js — the cart screen (cart.html)
   --------------------------------------------------------------------------
   No state of its own: localStorage IS the state. Every action calls a
   function from cart.js, which returns the new cart, and the page re-renders
   from that return value. One direction, no drift between screen and storage.
   ========================================================================== */

import {
  changeQty,
  clearCart,
  getCartCount,
  getCartTotal,
  getLineTotal,
  loadCart,
  removeFromCart,
  updateQty,
} from './cart.js';
import { escapeHTML, formatPrice, labelOf, mountHeader, stateHTML } from './ui.js';

const itemsBox = document.querySelector('#cart-items');
const summaryBox = document.querySelector('#cart-summary');
const layout = document.querySelector('#cart-layout');
const headline = document.querySelector('#cart-count');

const FREE_SHIPPING_OVER = 100;
const SHIPPING_FEE = 4.99;

/* --- Templates ---------------------------------------------------------- */

function lineHTML({ id, title, price, thumbnail, category, qty }) {
  return `
    <article class="cart-item" data-id="${escapeHTML(id)}">
      <img class="cart-item__img" src="${escapeHTML(thumbnail)}" width="200" height="200"
           alt="${escapeHTML(title)}" loading="lazy">
      <div class="cart-item__info">
        <h3 class="cart-item__title">
          <a href="product.html?id=${encodeURIComponent(id)}">${escapeHTML(title)}</a>
        </h3>
        <p class="cart-item__meta">${escapeHTML(labelOf(category))} · ${formatPrice(price)} each</p>
      </div>
      <div class="qty cart-item__qty">
        <button type="button" data-action="dec" aria-label="Decrease quantity of ${escapeHTML(title)}">−</button>
        <label class="visually-hidden" for="qty-${escapeHTML(id)}">Quantity of ${escapeHTML(title)}</label>
        <input id="qty-${escapeHTML(id)}" type="number" value="${qty}" min="1" max="99" data-action="set">
        <button type="button" data-action="inc" aria-label="Increase quantity of ${escapeHTML(title)}">+</button>
      </div>
      <p class="cart-item__price">${formatPrice(getLineTotal({ price, qty }))}</p>
      <button class="btn btn--icon cart-item__remove" type="button" data-action="remove">
        <span class="visually-hidden">Remove ${escapeHTML(title)} from cart</span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true">
          <path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13M10 11v6M14 11v6"></path>
        </svg>
      </button>
    </article>`;
}

function summaryHTML(cart) {
  const subtotal = getCartTotal(cart);
  const count = getCartCount(cart);
  const shipping = subtotal >= FREE_SHIPPING_OVER ? 0 : SHIPPING_FEE;
  const missing = FREE_SHIPPING_OVER - subtotal;

  return `
    <h2 id="summary-title">Order summary</h2>
    <div>
      <p class="summary__row">
        <span>Subtotal (${count} item${count === 1 ? '' : 's'})</span><span>${formatPrice(subtotal)}</span>
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

function render(cart = loadCart()) {
  headline.textContent =
    cart.length === 0
      ? 'Your cart is empty'
      : `${getCartCount(cart)} item${getCartCount(cart) === 1 ? '' : 's'} in your cart`;

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

/* --- Events: two delegated listeners for the entire page ---------------- */

itemsBox.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;

  const { id } = button.closest('[data-id]').dataset;
  const { action } = button.dataset;

  if (action === 'inc') render(changeQty(id, 1));
  if (action === 'dec') render(changeQty(id, -1));
  if (action === 'remove') render(removeFromCart(id));
});

// 'change' rather than 'input': typing "1" on the way to "12" would otherwise
// drop the line the moment the field is momentarily empty.
itemsBox.addEventListener('change', (event) => {
  const field = event.target.closest('input[data-action="set"]');
  if (!field) return;
  render(updateQty(field.closest('[data-id]').dataset.id, field.value));
});

summaryBox.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;

  if (button.dataset.action === 'clear') render(clearCart());
  if (button.dataset.action === 'checkout') {
    render(clearCart());
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
