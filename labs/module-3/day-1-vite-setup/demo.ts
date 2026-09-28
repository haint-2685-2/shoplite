// A small typed module. Read it, then look at what the browser received.

interface Product {
  readonly id: number;
  title: string;
  price: number;
}

type Currency = 'USD' | 'VND';

export function formatPrice(product: Product, currency: Currency = 'USD'): string {
  const amount: number = product.price;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

export const sample: Product = { id: 1, title: 'Kite 68 Keyboard', price: 46 };
