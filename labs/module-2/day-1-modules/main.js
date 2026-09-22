import { products, shopName } from './data.js';
import formatPrice, { titleCase } from './format.js';
import { cartTotal, describeCart } from './cart-math.js';

const out = document.querySelector('#out');
out.textContent = '';
const log = (line) => { out.textContent += line + '\n'; };

log(`${shopName} — ${products.length} products imported from data.js`);
log('');

products.forEach(({ title, price, category }) => {
  log(`${titleCase(category).padEnd(14)} ${title.padEnd(26)} ${formatPrice(price)}`);
});

const lines = [
  { ...products[0], qty: 2 },
  { ...products[1], qty: 1 },
];

log('');
log(describeCart(lines));
log(`cartTotal() alone: ${cartTotal(lines)}`);
log('');
log('Three things modules give you for free:');
log('1. every file has its own scope — no accidental globals');
log('2. imports are hoisted and evaluated once, however often you import them');
log('3. a module is always in strict mode');
