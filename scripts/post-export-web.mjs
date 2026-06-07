/**
 * After `expo export --platform web`, remove dist folders that only hold
 * dynamic `[param].html` shells. On Vercel those directories intercept `/u/*`
 * (and similar) and return NOT_FOUND before SPA rewrites run.
 */
import { existsSync, readdirSync, rmSync, statSync } from 'fs';
import { join, resolve } from 'path';

const dist = resolve(import.meta.dirname, '..', 'dist');

/** Top-level dist dirs that block client-side dynamic routing when present. */
const DYNAMIC_ROUTE_DIRS = ['u'];

function hasOnlyBracketHtml(dir) {
  if (!existsSync(dir)) return false;
  const entries = readdirSync(dir);
  return entries.length > 0 && entries.every((name) => /^\[[^\]]+\]\.html$/.test(name));
}

if (!existsSync(dist)) {
  console.error('post-export-web: dist/ not found — run expo export first');
  process.exit(1);
}

let removed = 0;
for (const name of DYNAMIC_ROUTE_DIRS) {
  const path = join(dist, name);
  if (!existsSync(path) || !statSync(path).isDirectory()) continue;
  if (!hasOnlyBracketHtml(path)) {
    console.warn(`post-export-web: skip ${name}/ — not only dynamic bracket html`);
    continue;
  }
  rmSync(path, { recursive: true, force: true });
  console.log(`post-export-web: removed dist/${name}/`);
  removed += 1;
}

if (removed === 0) {
  console.log('post-export-web: nothing to remove');
}
