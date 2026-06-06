-- Purge: el@maiba.studio + elbonuan@gmail.com
-- Safe to re-run: skips auth delete if users are already gone, still cleans orphans.

-- ═══════════════════════════════════════════════════════════════════════════
-- STEP 1 — Run this diagnostic alone first
-- ═══════════════════════════════════════════════════════════════════════════
/*
-- Auth users (may be 0 rows — that's OK if already deleted)
select id, email, created_at from auth.users
where lower(email) in ('el@maiba.studio', 'elbonuan@gmail.com')
   or id in (
     '821008c6-bf6c-43d5-b259-9498f5134ebf',
     '428a1f44-1991-4464-b5b1-ecc44aee4ab0'
   );

-- Orphan account rows (these can remain after auth delete)
select id, display_name, username, created_at from public.accounts
where id in (
  '821008c6-bf6c-43d5-b259-9498f5134ebf',
  '428a1f44-1991-4464-b5b1-ecc44aee4ab0'
);

-- All auth users (see what's actually left)
select id, email, created_at from auth.users order by created_at desc;
*/

-- ═══════════════════════════════════════════════════════════════════════════
-- STEP 2 — Full purge (select ALL from begin through commit, then Run)
-- ═══════════════════════════════════════════════════════════════════════════

begin;

-- Match by email OR by known UUIDs from your earlier preview
create temp table _purge_users on commit drop as
select id, email
from auth.users
where lower(email) in ('el@maiba.studio', 'elbonuan@gmail.com')
   or id in (
     '821008c6-bf6c-43d5-b259-9498f5134ebf',
     '428a1f44-1991-4464-b5b1-ecc44aee4ab0'
   );

-- Also purge orphan accounts even when auth.users row is already gone
create temp table _purge_accounts on commit drop as
select id
from public.accounts
where id in (
  '821008c6-bf6c-43d5-b259-9498f5134ebf',
  '428a1f44-1991-4464-b5b1-ecc44aee4ab0'
)
union
select id from _purge_users;

do $$
declare
  n_auth int;
  n_acct int;
begin
  select count(*) into n_auth from _purge_users;
  select count(*) into n_acct from _purge_accounts;
  if n_auth = 0 and n_acct = 0 then
    raise notice 'Nothing to purge — auth users and account rows are already gone.';
  else
    raise notice 'Purging % auth user(s), % account row(s)', n_auth, n_acct;
  end if;
end $$;

create temp table _purge_trees on commit drop as
select ft.id
from public.family_trees ft
join _purge_accounts a on a.id = ft.created_by_account_id;

delete from public.memorial_votes mv
using public.memorial_requests mr, _purge_trees t
where mv.request_id = mr.id and mr.family_tree_id = t.id;
delete from public.memorial_votes mv using _purge_trees t where mv.family_tree_id = t.id;
delete from public.memorial_requests mr using _purge_trees t where mr.family_tree_id = t.id;
delete from public.suggested_edits se using _purge_trees t where se.family_tree_id = t.id;
delete from public.node_change_log cl using _purge_trees t where cl.family_tree_id = t.id;
delete from public.notifications n using _purge_trees t where n.family_tree_id = t.id;
delete from public.memories m using _purge_trees t where m.family_tree_id = t.id;
delete from public.relationships r using _purge_trees t where r.family_tree_id = t.id;
delete from public.nodes n using _purge_trees t where n.family_tree_id = t.id;
delete from public.tree_memberships tm using _purge_trees t where tm.family_tree_id = t.id;
delete from public.family_trees ft using _purge_trees t where ft.id = t.id;

delete from public.tree_memberships tm using _purge_accounts a where tm.account_id = a.id;
delete from public.memorial_votes mv using _purge_accounts a where mv.account_id = a.id;
delete from public.memorial_requests mr using _purge_accounts a where mr.requested_by_account_id = a.id;
delete from public.notifications n using _purge_accounts a
where n.recipient_account_id = a.id or n.actor_account_id = a.id;
delete from public.suggested_edits se using _purge_accounts a
where se.suggested_by_account_id = a.id or se.reviewed_by_account_id = a.id;
delete from public.node_change_log cl using _purge_accounts a where cl.performed_by_account_id = a.id;
delete from public.memories m using _purge_accounts a where m.created_by_account_id = a.id;
delete from public.relationships r using _purge_accounts a where r.created_by_account_id = a.id;

update public.nodes n set owner_account_id = null from _purge_accounts a where n.owner_account_id = a.id;
update public.nodes n set managed_by_account_id = null from _purge_accounts a where n.managed_by_account_id = a.id;
update public.nodes n set deleted_by = null from _purge_accounts a where n.deleted_by = a.id;

delete from public.accounts acc using _purge_accounts a where acc.id = a.id;

-- NOTE: Supabase blocks direct DELETE on storage.objects (protect_delete trigger).
-- If auth delete fails due to storage ownership, remove files manually:
--   Dashboard → Storage → browse buckets → delete files for that user
-- Or list orphans (read-only) with:
--   select id, bucket_id, name, owner from storage.objects
--   where owner in ('821008c6-bf6c-43d5-b259-9498f5134ebf','428a1f44-1991-4464-b5b1-ecc44aee4ab0');

-- Auth child tables mix uuid / varchar user_id — compare as text
delete from auth.sessions s using _purge_users u where s.user_id::text = u.id::text;
delete from auth.refresh_tokens rt using _purge_users u where rt.user_id = u.id::text;
delete from auth.mfa_factors mf using _purge_users u where mf.user_id::text = u.id::text;
delete from auth.one_time_tokens ott using _purge_users u where ott.user_id::text = u.id::text;
delete from auth.identities i using _purge_users u where i.user_id = u.id;
delete from auth.users au using _purge_users u where au.id = u.id;

commit;

-- ═══════════════════════════════════════════════════════════════════════════
-- STEP 3 — Verify (run after commit)
-- ═══════════════════════════════════════════════════════════════════════════
select 'auth.users' as tbl, id::text, email::text as label from auth.users
where lower(email) in ('el@maiba.studio', 'elbonuan@gmail.com')
union all
select 'accounts' as tbl, id::text, display_name from public.accounts
where id in (
  '821008c6-bf6c-43d5-b259-9498f5134ebf',
  '428a1f44-1991-4464-b5b1-ecc44aee4ab0'
);
-- Both should return 0 rows
