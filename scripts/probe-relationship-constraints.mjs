import pg from 'pg';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const { Client } = pg;
const root = resolve(import.meta.dirname, '..');
const password = process.env.SUPABASE_DB_PASSWORD?.trim();
if (!password) {
  console.log('NO_DB_PASSWORD — set SUPABASE_DB_PASSWORD to inspect constraints');
  process.exit(0);
}

const env = readFileSync(resolve(root, '.env'), 'utf8');
const url = env.match(/EXPO_PUBLIC_SUPABASE_URL=(.+)/)?.[1]?.trim();
const host = url.replace('https://', '').replace('.supabase.co', '');

const client = new Client({
  host: `db.${host}.supabase.co`,
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password,
  ssl: { rejectUnauthorized: false },
});

await client.connect();
const constraints = await client.query(`
  SELECT conname, pg_get_constraintdef(oid) AS def
  FROM pg_constraint
  WHERE conrelid = 'public.relationships'::regclass
`);
console.log('constraints:', JSON.stringify(constraints.rows, null, 2));

const col = await client.query(`
  SELECT column_name, data_type, udt_name
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'relationships'
    AND column_name IN ('relationship_type', 'relationship_detail')
`);
console.log('columns:', JSON.stringify(col.rows, null, 2));

await client.end();
