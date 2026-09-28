import { defineConfig } from 'vite';

/*
  ShopLite is a multi-page app: three real HTML files, not one SPA shell.
  In dev Vite serves any .html it finds; for the build every page has to be
  listed, otherwise only index.html ends up in dist/.
  Paths are relative to the project root (where `npm run build` runs).
*/
export default defineConfig({
  build: {
    rolldownOptions: {
      input: {
        home: 'index.html',
        product: 'product.html',
        cart: 'cart.html',
      },
    },
  },
});
