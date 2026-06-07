/**
 * Probe the linked Supabase project for migration artifacts.
 * Reads EXPO_PUBLIC_SUPABASE_URL + EXPO_PUBLIC_SUPABASE_ANON_KEY from .env
 *
 * Usage: node scripts/check-supabase-migrations.mjs
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const root = resolve(import.meta.dirname, '..');
const envPath = resolve(root, '.env');
if (!existsSync(envPath)) {
  console.error('Missing .env — add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const env = readFileSync(envPath, 'utf8');
const url = env.match(/EXPO_PUBLIC_SUPABASE_URL=(.+)/)?.[1]?.trim();
const key = env.match(/EXPO_PUBLIC_SUPABASE_ANON_KEY=(.+)/)?.[1]?.trim();
if (!url || !key) {
  console.error('.env must define EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const sb = createClient(url, key);

const MIGRATIONS = [
  { version: '20260606100000', name: 'resolve_login_email', probe: () => sb.rpc('resolve_login_email', { p_identifier: 'probe@example.com' }) },
  { version: '20260606110000', name: 'storage_quota_and_memorial_votes', probe: () => sb.rpc('assert_storage_quota', { p_account_id: '00000000-0000-0000-0000-000000000000', p_add_bytes: 0 }) },
  { version: '20260606120000', name: 'relationship_wedding_date', probe: () => col('relationships', 'wedding_date') },
  { version: '20260606130000', name: 'relationship_detail', probe: () => col('relationships', 'relationship_detail') },
  { version: '20260606140000', name: 'node_soft_delete', probe: () => col('nodes', 'deleted_at') },
  { version: '20260606150000', name: 'peek_invite_code', probe: () => sb.rpc('peek_invite_code', { p_code: 'PROBE000' }) },
  {
    version: '20260606160000',
    name: 'claim_security',
    probe: async () => {
      const colCheck = await col('nodes', 'invite_expires_at');
      if (colCheck.error) return colCheck;
      return sb.rpc('request_node_transfer', { p_node_id: '00000000-0000-0000-0000-000000000000', p_to_email: 'a@b.co' });
    },
  },
  {
    version: '20260606170000',
    name: 'relationship_types_in_law',
    probe: () => sb.rpc('relationship_types_supports_in_law'),
  },
  {
    version: '20260606180000',
    name: 'nodes_status_deleted',
    probe: () => sb.rpc('nodes_status_supports_deleted'),
  },
  {
    version: '20260606190000',
    name: 'public_profile',
    probe: () => sb.rpc('public_profile_supports_v2'),
  },
  {
    version: '20260606200000',
    name: 'public_memory_media_access',
    probe: () => sb.rpc('public_profile_media_access_enabled'),
  },
];

async function col(table, column) {
  const { error } = await sb.from(table).select(column).limit(0);
  if (error?.message?.includes('does not exist')) {
    return { error: { code: 'MISSING_COLUMN', message: error.message } };
  }
  if (error?.code === 'PGRST205') {
    return { error: { code: 'MISSING_TABLE', message: error.message } };
  }
  return { error: null };
}

function classify(result) {
  const err = result?.error;
  if (!err) return 'applied';
  if (err.code === 'PGRST202') return 'missing';
  if (err.code === 'MISSING_COLUMN' || err.code === 'MISSING_TABLE') return 'missing';
  // Function exists (e.g. NOT_SIGNED_IN, INVALID_CODE, Enter your email)
  if (err.code === 'P0001' || err.message?.includes('NOT_SIGNED_IN')) return 'applied';
  if (result?.data !== undefined && result?.data !== null) return 'applied';
  if (result?.data === true) return 'applied';
  if (result?.data === false) return 'missing';
  return 'unknown';
}

console.log(`Checking ${url}\n`);

let missing = 0;
for (const m of MIGRATIONS) {
  const result = await m.probe();
  const status = classify(result);
  const icon = status === 'applied' ? '✓' : status === 'missing' ? '✗' : '?';
  if (status === 'missing') missing++;
  console.log(`${icon} ${m.version} ${m.name} — ${status}`);
  if (status === 'unknown' && result?.error) {
    console.log(`    ${result.error.code ?? ''} ${result.error.message}`);
  }
}

console.log(missing ? `\n${missing} migration(s) still need to be applied.` : '\nAll tracked migrations appear applied.');
process.exit(missing ? 1 : 0);
