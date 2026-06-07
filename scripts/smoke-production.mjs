/**
 * Production smoke checks for Tomora (Item F).
 *
 * Usage:
 *   node scripts/smoke-production.mjs
 *   node scripts/smoke-production.mjs --base https://www.tomora.app --username elbonuan
 *
 * Reads Supabase creds from .env when present for RPC probes.
 */
import { createClient } from '@supabase/supabase-js';
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

const args = process.argv.slice(2);
function arg(name, fallback) {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
}

const BASE = arg('--base', 'https://www.tomora.app').replace(/\/$/, '');
const USERNAME = arg('--username', 'elbonuan');
const APEX = 'https://tomora.app';

const root = resolve(import.meta.dirname, '..');
const envPath = resolve(root, '.env');
let supabaseUrl;
let supabaseKey;
if (existsSync(envPath)) {
  const env = readFileSync(envPath, 'utf8');
  supabaseUrl = env.match(/EXPO_PUBLIC_SUPABASE_URL=(.+)/)?.[1]?.trim();
  supabaseKey = env.match(/EXPO_PUBLIC_SUPABASE_ANON_KEY=(.+)/)?.[1]?.trim();
}

const results = [];

function record(name, ok, detail) {
  results.push({ name, ok, detail });
  const mark = ok ? 'PASS' : 'FAIL';
  console.log(`${mark}  ${name}${detail ? ` — ${detail}` : ''}`);
}

async function head(url) {
  const res = await fetch(url, { method: 'HEAD', redirect: 'follow' });
  return { status: res.status, url: res.url };
}

async function checkStaticShell() {
  const shell = await fetch(`${BASE}/u/%5Busername%5D.html`, { redirect: 'manual' });
  const hasShell =
    shell.status === 200 ||
    shell.status === 308 ||
    shell.headers.get('location')?.includes('[username]');
  record(
    'No dist/u/[username].html shell on CDN',
    !hasShell,
    hasShell
      ? 'static shell still deployed — post-export did not run on Vercel build'
      : 'shell absent',
  );
}

async function checkHttp() {
  const home = await head(`${BASE}/`);
  record('Home (www)', home.status === 200, `HTTP ${home.status}`);

  const claim = await head(`${BASE}/claim`);
  record('Claim page', claim.status === 200, `HTTP ${claim.status}`);

  await checkStaticShell();

  const profile = await head(`${BASE}/u/${encodeURIComponent(USERNAME)}`);
  record(
    'Public profile route /u/{username}',
    profile.status === 200,
    profile.status === 404
      ? 'HTTP 404 — set Vercel Build Command to npm run vercel-build and redeploy'
      : `HTTP ${profile.status}`,
  );

  const apex = await head(`${APEX}/u/${encodeURIComponent(USERNAME)}`);
  const apexOk = apex.url.includes('www.tomora.app') || apex.status === 200;
  record('Apex tomora.app redirects to www', apexOk, `final ${apex.url} (${apex.status})`);
}

async function checkSupabase() {
  if (!supabaseUrl || !supabaseKey) {
    record('Supabase RPC probes', true, 'skipped (no .env)');
    return;
  }

  const sb = createClient(supabaseUrl, supabaseKey);

  const { data: profile, error: profileErr } = await sb.rpc('get_public_profile', {
    p_username: USERNAME.toLowerCase(),
  });
  if (profileErr) {
    record('get_public_profile RPC', false, profileErr.message);
  } else if (!profile) {
    record('get_public_profile RPC', false, `no row for @${USERNAME} (disabled or missing username)`);
  } else {
    record(
      'get_public_profile RPC',
      true,
      `${profile.displayName ?? 'profile'} · ${(profile.memories ?? []).length} public memories`,
    );
  }

  const { error: peekErr } = await sb.rpc('peek_invite_code', { p_code: 'SMOKE00' });
  record(
    'peek_invite_code RPC',
    !peekErr || !peekErr.message.includes('does not exist'),
    peekErr?.message ?? 'callable',
  );
}

console.log(`\nTomora production smoke — ${BASE} · @${USERNAME}\n`);

await checkHttp();
await checkSupabase();

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
if (failed.length) {
  console.log('\nNext steps:');
  if (failed.some((f) => f.name.includes('Public profile') || f.name.includes('dist/u'))) {
    console.log('  • Vercel → Project Settings → Build Command: npm run vercel-build');
    console.log('  • Turn OFF any override that only runs `npx expo export --platform web`');
    console.log('  • Redeploy; build log should show "post-export-web: removed dist/u/"');
    console.log('  • Confirm EXPO_PUBLIC_APP_URL=https://www.tomora.app in Vercel env');
  }
  if (failed.some((f) => f.name.includes('get_public_profile'))) {
    console.log('  • Turn on public profile in app + set username in Account settings');
    console.log('  • Apply storage policy: supabase/scripts/storage_public_profile_policy.sql');
  }
  process.exit(1);
}
