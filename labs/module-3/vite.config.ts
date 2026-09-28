import { defineConfig } from 'vite';

const LABS = [
  'day-1-vite-setup',
  'day-1-basic-types',
  'day-1-interface-type',
  'day-1-union-narrowing',
  'day-1-function-typing',
  'day-2-generics',
  'day-2-typed-fetch',
  'day-2-unknown-vs-any',
  'day-2-strict-mode',
];

// Dev serves every folder as-is; the build needs each page listed.
export default defineConfig({
  build: {
    rolldownOptions: {
      input: {
        index: 'index.html',
        ...Object.fromEntries(LABS.map((lab) => [lab, `${lab}/index.html`])),
      },
    },
  },
});
