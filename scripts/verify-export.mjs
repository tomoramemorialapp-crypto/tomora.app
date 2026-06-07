/**
 * Verify a local dist/ folder is safe to deploy (no blocking dynamic route dirs).
 * Usage: node scripts/verify-export.mjs
 */
import { existsSync, readdirSync, statSync } from 'fs';
import { join, resolve } from 'path';

const dist = resolve(import.meta.dirname, '..', 'dist');
const BLOCKING = ['u'];

if (!existsSync(dist)) {
  console.error('verify-export: dist/ missing — run npm run vercel-build first');
  process.exit(1);
}

let ok = true;
for (const name of BLOCKING) {
  const path = join(dist, name);
  if (existsSync(path) && statSync(path).isDirectory()) {
    const files = readdirSync(path);
    console.error(`verify-export: FAIL dist/${name}/ still exists (${files.join(', ')})`);
    ok = false;
  }
}

if (!existsSync(join(dist, 'index.html'))) {
  console.error('verify-export: FAIL dist/index.html missing');
  ok = false;
}

if (ok) {
  console.log('verify-export: PASS — dist is safe for /u/* client routing');
} else {
  process.exit(1);
}
