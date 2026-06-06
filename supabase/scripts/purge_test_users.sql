-- Remove specific Tomora users (including Gmail accounts) + all data blocking deletion.
-- Run in Supabase → SQL Editor.
--
-- Dashboard "Database error deleting user" happens because public.accounts,
-- family_trees, nodes, memories, etc. still reference auth.users.id.
--
-- HOW TO USE (Gmail test accounts):
--   Step A — Run ONLY the "Step 0" block below to list users. Copy exact emails.
--   Step B — Paste those emails into the list in Step 1 (lowercase).
--   Step C — Run Step 1 preview. Confirm ONLY accounts you want gone.
--   Step D — Run Steps 2–5 (or the whole script from "begin").

-- ═══════════════════════════════════════════════════════════════════════════
-- Step 0 — LIST users (run this first, alone)
-- ═══════════════════════════════════════════════════════════════════════════
/*
select
  u.id,
  u.email,
  u.created_at,
  u.email_confirmed_at,
  a.username,
  a.display_name,
  (select count(*) from public.family_trees ft where ft.created_by_account_id = u.id) as trees_created
from auth.users u
left join public.accounts a on a.id = u.id
order by u.created_at desc;
*/

-- ═══════════════════════════════════════════════════════════════════════════
-- Steps 1–5 — PURGE (edit emails, preview, then delete)
-- ═══════════════════════════════════════════════════════════════════════════

begin;

-- ── Step 1: Exact emails to remove (EDIT THIS — use lowercase) ─────────────
create temp table _purge_users on commit drop as
select id, email, created_at
from auth.users
where lower(email) in (
  'youremail1@gmail.com',
  'youremail2@gmail.com',
  'youremail3@gmail.com'
);

-- Preview — STOP if you see an account you want to keep
select
  u.id,
  u.email,
  u.created_at,
  a.username,
  a.display_name
from _purge_users u
left join public.accounts a on a.id = u.id
order by u.created_at;

-- Abort if nothing matched (prevents accidental empty purge)
do $$
begin
  if (select count(*) from _purge_users) = 0 then
    raise exception 'No users matched. Edit the email list in Step 1 (use exact Gmail addresses, lowercase).';
  end if;
end $$;

-- ── Step 2: Delete family trees created by these users ────────────────────
create temp table _purge_trees on commit drop as
select ft.id
from public.family_trees ft
join _purge_users u on u.id = ft.created_by_account_id;

delete from public.memorial_votes mv
using public.memorial_requests mr, _purge_trees t
where mv.request_id = mr.id and mr.family_tree_id = t.id;

delete from public.memorial_votes mv
using _purge_trees t
where mv.family_tree_id = t.id;

delete from public.memorial_requests mr
using _purge_trees t
where mr.family_tree_id = t.id;

delete from public.suggested_edits se using _purge_trees t where se.family_tree_id = t.id;
delete from public.node_change_log cl using _purge_trees t where cl.family_tree_id = t.id;
delete from public.notifications n using _purge_trees t where n.family_tree_id = t.id;
delete from public.memories m using _purge_trees t where m.family_tree_id = t.id;
delete from public.relationships r using _purge_trees t where r.family_tree_id = t.id;
delete from public.nodes n using _purge_trees t where n.family_tree_id = t.id;
delete from public.tree_memberships tm using _purge_trees t where tm.family_tree_id = t.id;
delete from public.family_trees ft using _purge_trees t where ft.id = t.id;

-- ── Step 3: Cross-tree references ─────────────────────────────────────────
delete from public.tree_memberships tm using _purge_users u where tm.account_id = u.id;
delete from public.memorial_votes mv using _purge_users u where mv.account_id = u.id;
delete from public.memorial_requests mr using _purge_users u where mr.requested_by_account_id = u.id;
delete from public.notifications n using _purge_users u
where n.recipient_account_id = u.id or n.actor_account_id = u.id;
delete from public.suggested_edits se using _purge_users u
where se.suggested_by_account_id = u.id or se.reviewed_by_account_id = u.id;
delete from public.node_change_log cl using _purge_users u where cl.performed_by_account_id = u.id;
delete from public.memories m using _purge_users u where m.created_by_account_id = u.id;
delete from public.relationships r using _purge_users u where r.created_by_account_id = u.id;

update public.nodes n set owner_account_id = null from _purge_users u where n.owner_account_id = u.id;
update public.nodes n set managed_by_account_id = null from _purge_users u where n.managed_by_account_id = u.id;
update public.nodes n set deleted_by = null from _purge_users u where n.deleted_by = u.id;

-- ── Step 4: App account row ───────────────────────────────────────────────
delete from public.accounts a using _purge_users u where a.id = u.id;

-- ── Step 5: Auth user ─────────────────────────────────────────────────────
delete from auth.sessions s using _purge_users u where s.user_id::text = u.id::text;
delete from auth.refresh_tokens rt using _purge_users u where rt.user_id = u.id::text;
delete from auth.mfa_factors mf using _purge_users u where mf.user_id::text = u.id::text;
delete from auth.one_time_tokens ott using _purge_users u where ott.user_id::text = u.id::text;
delete from auth.identities i using _purge_users u where i.user_id = u.id;
delete from auth.users au using _purge_users u where au.id = u.id;

commit;

-- Verify (edit same emails as Step 1 — should return 0 rows)
select id, email from auth.users
where lower(email) in (
  'youremail1@gmail.com',
  'youremail2@gmail.com',
  'youremail3@gmail.com'
);
