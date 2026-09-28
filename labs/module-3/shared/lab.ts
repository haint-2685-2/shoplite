/* Shared helpers for the module 3 labs: a tiny logger and the table of
   compiler errors each lab expects.

   The table is read straight from the lab's own source. Every deliberate
   mistake in a lab is written as

     // @ts-expect-error TSxxxx <the exact compiler message>
     price = '19.99'; // fix: price = 19.99;

   tsc fails the build if the line below a directive stops being an error,
   so the table can never list an error that is not really there.
   `npm run check:errors` additionally checks that the quoted message is the
   one the compiler prints. */

/** A required element, checked with instanceof instead of a cast. */
export function $<T extends Element>(selector: string, type: { new (): T; prototype: T }): T {
  const found = document.querySelector(selector);
  if (!(found instanceof type)) throw new Error(`Missing ${type.name}: ${selector}`);
  return found;
}

const logBox = (): HTMLPreElement => $('#log', HTMLPreElement);

function show(value: unknown): string {
  if (typeof value === 'string') return value;
  // JSON.stringify would print NaN as null and drop undefined entirely.
  if (typeof value === 'number' || typeof value === 'boolean' || value === undefined) return String(value);
  if (value instanceof Error) return `${value.name}: ${value.message}`;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

/** Appends one line to the page's <pre id="log">. */
export function log(...values: unknown[]): void {
  const box = logBox();
  box.textContent += `${values.map(show).join(' ')}\n`;
}

export function clearLog(): void {
  logBox().textContent = '';
}

export function heading(title: string): void {
  const box = logBox();
  box.textContent += `${box.textContent ? '\n' : ''}── ${title} ──\n`;
}

export interface ExpectedError {
  line: number;
  code: string;
  message: string;
  source: string;
  fix: string;
}

const DIRECTIVE = /^\s*\/\/ @ts-expect-error (TS\d+) (.+)$/;

/** Pulls every `@ts-expect-error TSxxxx message` + the line under it out of a source. */
export function parseExpectedErrors(source: string): ExpectedError[] {
  const lines = source.split(/\r?\n/);
  const found: ExpectedError[] = [];

  lines.forEach((text, index) => {
    const match = DIRECTIVE.exec(text);
    const next = lines[index + 1];
    if (!match || next === undefined) return;

    const [, code = '', message = ''] = match;
    const [statement = '', fix = ''] = next.split(/\s*\/\/ fix: /);
    found.push({ line: index + 2, code, message, source: statement.trim(), fix: fix.trim() });
  });

  return found;
}

const escape = (text: string): string =>
  text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

/** Renders the expected-error table into <div id="errors">. */
export function renderExpectedErrors(source: string, file = 'main.ts'): void {
  const rows = parseExpectedErrors(source);
  $('#errors', HTMLDivElement).innerHTML = `
    <p class="note">${rows.length} deliberate mistakes in <code>${file}</code>. Delete the
    <code>// @ts-expect-error</code> line above one of them to see the red squiggle in
    VS Code, or run <code>npm run typecheck</code>.</p>
    <table>
      <thead><tr><th>Line</th><th>Code</th><th>Compiler says</th><th>Fix</th></tr></thead>
      <tbody>
        ${rows
          .map(
            (row) => `
              <tr>
                <td>${row.line}</td>
                <td><code>${escape(row.source)}</code></td>
                <td class="msg"><code>${row.code}</code> ${escape(row.message)}</td>
                <td class="fix">${row.fix ? `<code>${escape(row.fix)}</code>` : '—'}</td>
              </tr>`
          )
          .join('')}
      </tbody>
    </table>`;
}

/** Wraps a demo that is EXPECTED to blow up, and logs what it threw. */
export function tryRun(label: string, run: () => unknown): void {
  try {
    log(`${label} →`, run());
  } catch (error) {
    log(`${label} → 💥`, error);
  }
}
