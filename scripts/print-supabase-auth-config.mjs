/**
 * Print Supabase Auth URL settings for the Tomora dashboard.
 * Usage: node scripts/print-supabase-auth-config.mjs
 */
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const root = resolve(import.meta.dirname, '..');
const envPath = resolve(root, '.env');
const env = existsSync(envPath) ? readFileSync(envPath, 'utf8') : '';
const appUrl = (env.match(/EXPO_PUBLIC_APP_URL=(.+)/)?.[1] ?? 'https://www.tomora.app').trim().replace(/\/$/, '');

const productionOrigins =
  appUrl.includes('tomora.app') ? ['https://www.tomora.app', 'https://tomora.app'] : [appUrl];

const devOrigins = ['http://localhost:8081', 'http://localhost:3000'];

function redirectSet(origins) {
  const urls = [];
  for (const origin of origins) {
    urls.push(`${origin}/**`);
    urls.push(`${origin}/auth/callback`);
    urls.push(`${origin}/auth/callback?next=onboarding`);
    urls.push(`${origin}/auth/callback?next=claim`);
    urls.push(`${origin}/auth/callback?next=reset-password`);
  }
  return [...new Set(urls)];
}

const siteUrl = productionOrigins[0];
const redirectUrls = [...redirectSet(productionOrigins), ...redirectSet(devOrigins)];

console.log('\nSupabase Dashboard → Authentication → URL Configuration\n');
console.log('Site URL (must NOT be localhost in production):');
console.log(`  ${siteUrl}\n`);
console.log('Redirect URLs (add each line):');
for (const u of redirectUrls) console.log(`  ${u}`);
console.log('\nIf verification emails still open localhost, the Site URL above is wrong in Supabase.\n');
