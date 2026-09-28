import { $, log } from '../shared/lab.ts';
import { formatPrice, sample } from './demo.ts';
// ?raw is a Vite feature, typed by "types": ["vite/client"] in tsconfig.
import source from './demo.ts?raw';

$('#source', HTMLPreElement).textContent = source;

log('import.meta.env.MODE =', import.meta.env.MODE); // typed by vite/client
log('formatPrice(sample) =', formatPrice(sample));
log('formatPrice(sample, "VND") =', formatPrice(sample, 'VND'));
log('typeof sample =', typeof sample, '— just an object; the Product interface is gone');

async function showServedCode(): Promise<void> {
  const served = $('#served', HTMLPreElement);

  if (!import.meta.env.DEV) {
    served.textContent = 'Only available under `npm run dev`: after a build, demo.ts is bundled away.';
    return;
  }

  // In dev, requesting a .ts URL returns Vite's JavaScript for it.
  const url = import.meta.url.replace(/main\.ts.*$/, 'demo.ts');
  const res = await fetch(url);
  const code = await res.text();
  // Drop Vite's inline source map comment, it is one very long line.
  served.textContent = code.replace(/\n\/\/# sourceMappingURL=.*$/s, '');
}

void showServedCode();
