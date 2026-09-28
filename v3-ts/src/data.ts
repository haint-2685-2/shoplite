/* ==========================================================================
   data.ts — the offline fallback catalogue (module 2 -> 3)
   --------------------------------------------------------------------------
   Same twelve products as v2, now annotated `Product[]`: a missing field or
   a price written as "99.99" is a compile error here, not a broken card on
   the day the API goes down and this file is finally used.
   ========================================================================== */

import type { Product } from './types.ts';

export const products: Product[] = [
  {
    id: 1,
    title: 'Aura X2 Noise-Cancelling Headphones',
    description:
      'Hybrid active noise cancellation cuts up to 42 dB, 40 mm drivers deliver a dense low end, and the 40-hour battery charges fast.',
    price: 99.99,
    discountPercentage: 22.4,
    rating: 4.8,
    stock: 12,
    brand: 'Aura',
    category: 'audio',
    thumbnail: 'https://picsum.photos/seed/shoplite-aura/440/440',
    images: [
      'https://picsum.photos/seed/shoplite-aura/900/675',
      'https://picsum.photos/seed/shoplite-aura-2/900/675',
      'https://picsum.photos/seed/shoplite-aura-3/900/675',
    ],
  },
  {
    id: 2,
    title: 'Nova 12 Pro Smartphone 256GB',
    description:
      'A 6.7-inch 120 Hz display, a triple camera with optical stabilisation and a 5000 mAh battery that charges to 60% in half an hour.',
    price: 519.0,
    discountPercentage: 0,
    rating: 4.7,
    stock: 31,
    brand: 'Nova',
    category: 'smartphones',
    thumbnail: 'https://picsum.photos/seed/shoplite-nova/440/440',
    images: ['https://picsum.photos/seed/shoplite-nova/900/675'],
  },
  {
    id: 3,
    title: 'Zenbook Air 14-inch Laptop',
    description:
      '1.1 kg of magnesium alloy, a 2.8K OLED panel and 16 GB of memory soldered next to a chip that stays quiet under load.',
    price: 860.0,
    discountPercentage: 5.2,
    rating: 4.9,
    stock: 7,
    brand: 'Zen',
    category: 'laptops',
    thumbnail: 'https://picsum.photos/seed/shoplite-zen/440/440',
    images: ['https://picsum.photos/seed/shoplite-zen/900/675'],
  },
  {
    id: 4,
    title: 'Pulse 3 Smartwatch',
    description:
      'Continuous heart-rate and SpO2 tracking, 30 sport modes, 10 days of battery and a case you can take swimming.',
    price: 75.5,
    discountPercentage: 17.0,
    rating: 4.5,
    stock: 54,
    brand: 'Pulse',
    category: 'watches',
    thumbnail: 'https://picsum.photos/seed/shoplite-pulse/440/440',
    images: ['https://picsum.photos/seed/shoplite-pulse/900/675'],
  },
  {
    id: 5,
    title: 'Kite 68 Mechanical Keyboard',
    description:
      'A 65% hot-swappable layout with gasket mounting, south-facing RGB and brown switches that stay civil in an open office.',
    price: 46.0,
    discountPercentage: 0,
    rating: 4.6,
    stock: 23,
    brand: 'Kite',
    category: 'accessories',
    thumbnail: 'https://picsum.photos/seed/shoplite-kite/440/440',
    images: ['https://picsum.photos/seed/shoplite-kite/900/675'],
  },
  {
    id: 6,
    title: 'Glide M2 Wireless Mouse',
    description:
      'A 26K sensor, 70 hours per charge and a 62 g shell — light enough to move all day without wearing out your wrist.',
    price: 23.6,
    discountPercentage: 8.5,
    rating: 4.4,
    stock: 88,
    brand: 'Glide',
    category: 'accessories',
    thumbnail: 'https://picsum.photos/seed/shoplite-glide/440/440',
    images: ['https://picsum.photos/seed/shoplite-glide/900/675'],
  },
  {
    id: 7,
    title: 'Boom Mini Bluetooth Speaker',
    description:
      'A pocket cylinder with a passive radiator, IP67 waterproofing and 14 hours of playback from a 20-minute top-up.',
    price: 31.2,
    discountPercentage: 18.0,
    rating: 4.3,
    stock: 40,
    brand: 'Boom',
    category: 'audio',
    thumbnail: 'https://picsum.photos/seed/shoplite-boom/440/440',
    images: ['https://picsum.photos/seed/shoplite-boom/900/675'],
  },
  {
    id: 8,
    title: 'Paper 7 E-Reader',
    description:
      'A 7-inch 300 ppi screen with adjustable warm light, 32 GB of storage and weeks of reading between charges.',
    price: 138.0,
    discountPercentage: 0,
    rating: 4.8,
    stock: 15,
    brand: 'Paper',
    category: 'e-readers',
    thumbnail: 'https://picsum.photos/seed/shoplite-paper/440/440',
    images: ['https://picsum.photos/seed/shoplite-paper/900/675'],
  },
  {
    id: 9,
    title: 'Aura Buds Pro Earbuds',
    description:
      'Adaptive noise cancellation, transparency mode and a case that holds four extra charges in a shell the size of a walnut.',
    price: 67.9,
    discountPercentage: 12.0,
    rating: 4.6,
    stock: 62,
    brand: 'Aura',
    category: 'audio',
    thumbnail: 'https://picsum.photos/seed/shoplite-buds/440/440',
    images: ['https://picsum.photos/seed/shoplite-buds/900/675'],
  },
  {
    id: 10,
    title: 'Studio One Recording Microphone',
    description:
      'A large-diaphragm condenser with a cardioid pattern, a built-in shock mount and a USB-C output that needs no interface.',
    price: 86.0,
    discountPercentage: 0,
    rating: 4.7,
    stock: 9,
    brand: 'Studio',
    category: 'audio',
    thumbnail: 'https://picsum.photos/seed/shoplite-mic/440/440',
    images: ['https://picsum.photos/seed/shoplite-mic/900/675'],
  },
  {
    id: 11,
    title: 'Vista 27 4K Monitor',
    description:
      'A 27-inch IPS panel at 144 Hz with 95% DCI-P3 coverage, a USB-C port that carries 90 W and a stand that pivots.',
    price: 329.0,
    discountPercentage: 9.0,
    rating: 4.5,
    stock: 11,
    brand: 'Vista',
    category: 'accessories',
    thumbnail: 'https://picsum.photos/seed/shoplite-vista/440/440',
    images: ['https://picsum.photos/seed/shoplite-vista/900/675'],
  },
  {
    id: 12,
    title: 'Tab S9 Lite Tablet 128GB',
    description:
      'An 11-inch 90 Hz screen, quad speakers and a pen that snaps to the back magnetically — for reading, drawing and little else.',
    price: 248.0,
    discountPercentage: 6.4,
    rating: 4.4,
    stock: 18,
    brand: 'Tab',
    category: 'tablets',
    thumbnail: 'https://picsum.photos/seed/shoplite-tab/440/440',
    images: ['https://picsum.photos/seed/shoplite-tab/900/675'],
  },
];

/* The categories the nav bar offers. Derived from the data, never hard-coded. */
export const categories: string[] = [...new Set(products.map((p) => p.category))].sort();
