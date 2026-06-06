/**
 * Apply pending SQL migrations to the remote Supabase database.
 *
 * Requires the database password from:
 *   Supabase Dashboard → Project Settings → Database → Database password
 *
 * Usage (PowerShell):
 *   $env:SUPABASE_DB_PASSWORD = "your-db-password"
 *   node scripts/apply-pending-migrations.mjs
 *
 * Or paste supabase/scripts/apply_pending_migrations.sql into the SQL Editor instead.
 */
import pg from 'pg';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const { Client } = pg;
const root = resolve(import.meta.dirname, '..');
const envPath = resolve(root, '.env');
const sqlPath = resolve(root, 'supabase/scripts/apply_pending_migrations.sql');

const password = process.env.SUPABASE_DB_PASSWORD?.trim();
if (!password) {
  console.error('Set SUPABASE_DB_PASSWORD to your Supabase database password, then re-run.');
  console.error('Dashboard: https://supabase.com/dashboard/project/elugrhxdkwdishxagdur/settings/database');
  console.error('Alternatively, paste supabase/scripts/apply_pending_migrations.sql into the SQL Editor.');
  process.exit(1);
}

if (!existsSync(sqlPath)) {
  console.error('Missing', sqlPath);
  process.exit(1);
}

const env = existsSync(envPath) ? readFileSync(envPath, 'utf8') : '';
const urlMatch = env.match(/EXPO_PUBLIC_SUPABASE_URL=(.+)/)?.[1]?.trim();
const projectRef = urlMatch?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] ?? 'elugrhxdkwdishxagdur';

const connectionString =
  process.env.SUPABASE_DB_URL?.trim() ??
  `postgresql://postgres:${encodeURIComponent(password)}@db.${projectRef}.supabase.co:5432/postgres`;

const sql = readFileSync(sqlPath, 'utf8');

const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });

try {
  await client.connect();
  console.log(`Connected to db.${projectRef}.supabase.co — applying pending migrations…`);
  await client.query(sql);
  console.log('Done. Verifying…');
} catch (e) {
  console.error('Migration failed:', e.message);
  process.exit(1);
} finally {
  await client.end().catch(() => {});
}

const { spawn } = await import('child_process');
const verify = spawn('node', ['scripts/check-supabase-migrations.mjs'], { cwd: root, stdio: 'inherit', shell: true });
verify.on('close', (code) => process.exit(code ?? 1));
