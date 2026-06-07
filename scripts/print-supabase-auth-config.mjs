/**
 * Print Supabase Auth URL settings for the Tomora dashboard.
 * Usage: node scripts/print-supabase-auth-config.mjs
 */
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const root = resolve(import.meta.dirname, '..');
const envPath = resolve(root, '.env');
const env = existsSync(envPath) ? readFileSync(envPath, 'utf8') : '';
const appUrl = (env.match(/EXPO_PUBLIC_APP_URL=(.+)/)?.[1] ?? 'https://www.tomora.app').trim();

const siteUrl = appUrl;
const redirectUrls = [
  `${appUrl}/**`,
  `${appUrl}/auth/callback`,
  `${appUrl}/auth/callback?next=onboarding`,
  `${appUrl}/auth/callback?next=claim`,
  `${appUrl}/auth/callback?next=reset-password`,
  'http://localhost:8081/**',
  'http://localhost:8081/auth/callback',
  'http://localhost:3000/auth/callback',
];

console.log('\nSupabase Dashboard → Authentication → URL Configuration\n');
console.log('Site URL (must NOT be localhost in production):');
console.log(`  ${siteUrl}\n`);
console.log('Redirect URLs (add each line):');
for (const u of redirectUrls) console.log(`  ${u}`);
console.log('\nIf verification emails still open localhost, the Site URL above is wrong in Supabase.\n');
