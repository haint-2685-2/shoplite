/* A default export: one main thing per file, named on import. */
export default function formatPrice(value) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
}

/* A module can have both a default and named exports. */
export function titleCase(text) {
  return text.replace(/\b\w/g, (c) => c.toUpperCase());
}
