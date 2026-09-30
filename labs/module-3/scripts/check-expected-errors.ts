/* Verifies that every `// @ts-expect-error TSxxxx message` in the labs
   quotes the error the compiler really reports on the line below it.

   tsc alone only proves that SOME error is there. This script disables the
   directives in memory (the files on disk are untouched), compiles, and
   compares code + first line of the message.

   Run: npm run check:errors   (Node >= 23 runs .ts files directly) */

import ts from 'typescript';

const DIRECTIVE = /^(\s*)\/\/ @ts-expect-error (TS\d+) (.+)$/;

const configPath = ts.findConfigFile('.', ts.sys.fileExists, 'tsconfig.json');
if (!configPath) throw new Error('Run this from labs/module-3');

const config = ts.getParsedCommandLineOfConfigFile(configPath, {}, {
  ...ts.sys,
  onUnRecoverableConfigFileDiagnostic: (d) => {
    throw new Error(ts.flattenDiagnosticMessageText(d.messageText, '\n'));
  },
});
if (!config) throw new Error('Could not read tsconfig.json');

interface Claim {
  file: string;
  line: number; // 0-based line of the statement under the directive
  code: string;
  message: string;
}

const claims: Claim[] = [];
const labFiles = new Set(config.fileNames.map((f) => ts.sys.resolvePath(f)));

const host = ts.createCompilerHost(config.options);
const readSource = host.getSourceFile.bind(host);

host.getSourceFile = (fileName, languageVersion, onError, shouldCreate) => {
  const resolved = ts.sys.resolvePath(fileName);
  if (!labFiles.has(resolved)) return readSource(fileName, languageVersion, onError, shouldCreate);

  const lines = (ts.sys.readFile(fileName) ?? '').split(/\r?\n/);
  const patched = lines.map((text, index) => {
    const match = DIRECTIVE.exec(text);
    if (!match) return text;
    const [, indent = '', code = '', message = ''] = match;
    claims.push({ file: resolved, line: index + 1, code, message: message.trim() });
    return `${indent}// (expect-error disabled)`; // same line count, no directive
  });
  return ts.createSourceFile(fileName, patched.join('\n'), languageVersion);
};

const program = ts.createProgram(config.fileNames, config.options, host);
const diagnostics = ts.getPreEmitDiagnostics(program);

const actual = new Map<string, { code: string; message: string }[]>();
for (const d of diagnostics) {
  if (!d.file || d.start === undefined) continue;
  const { line } = d.file.getLineAndCharacterOfPosition(d.start);
  const key = `${ts.sys.resolvePath(d.file.fileName)}:${line}`;
  const first = ts.flattenDiagnosticMessageText(d.messageText, '\n').split('\n')[0] ?? '';
  actual.set(key, [...(actual.get(key) ?? []), { code: `TS${d.code}`, message: first.trim() }]);
}

let failures = 0;
for (const claim of claims) {
  const where = `${claim.file.replace(ts.sys.getCurrentDirectory(), '.')}:${claim.line + 1}`;
  const got = actual.get(`${claim.file}:${claim.line}`) ?? [];
  const hit = got.find((g) => g.code === claim.code && g.message === claim.message);
  if (hit) continue;

  failures += 1;
  console.log(`✗ ${where}`);
  console.log(`    claimed: ${claim.code} ${claim.message}`);
  for (const g of got) console.log(`    actual:  ${g.code} ${g.message}`);
  if (got.length === 0) console.log('    actual:  (no error on that line)');
}

console.log(`\n${claims.length - failures}/${claims.length} expected errors match the compiler.`);
if (failures > 0) ts.sys.exit(1);
