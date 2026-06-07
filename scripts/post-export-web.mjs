/**
 * After `expo export --platform web`, remove dist folders that only hold
 * dynamic `[param].html` shells (static export mode). With `web.output: single`
 * these should not exist; this script is a safety net if output mode changes.
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
    console.warn(`post-export-web: force-removing dist/${name}/ (unexpected contents)`);
  }

  rmSync(path, { recursive: true, force: true });
  console.log(`post-export-web: removed dist/${name}/`);
  removed += 1;
}

if (removed === 0) {
  console.log('post-export-web: no dynamic route shells to remove (expected for SPA export)');
}

if (existsSync(join(dist, 'u'))) {
  console.error('post-export-web: dist/u still present — public profiles will 404 on Vercel');
  process.exit(1);
}

console.log('post-export-web: export OK for SPA routing');
