-- Delete ONE user by email (works when dashboard says "User not found").
-- Run in Supabase → SQL Editor.
--
-- 1. Change the email on the line marked EDIT below.
-- 2. Run the DIAGNOSTIC block first — confirm 1 row.
-- 3. Run the PURGE block.

-- ═══════════════════════════════════════════════════════════════════════════
-- DIAGNOSTIC — run first
-- ═══════════════════════════════════════════════════════════════════════════
/*
select
  u.id,
  u.email,
  u.created_at,
  u.email_confirmed_at,
  a.username,
  a.display_name,
  exists (select 1 from public.accounts a2 where a2.id = u.id) as has_account_row
from auth.users u
left join public.accounts a on a.id = u.id
where lower(u.email) = lower('elnomenest@gmail.com');  -- EDIT email
*/

-- ═══════════════════════════════════════════════════════════════════════════
-- PURGE — run after diagnostic shows the correct user
-- ═══════════════════════════════════════════════════════════════════════════

begin;

create temp table _purge_users on commit drop as
select id, email, created_at
from auth.users
where lower(email) = lower('elnomenest@gmail.com');  -- EDIT email

select u.id, u.email, u.created_at, a.username, a.display_name
from _purge_users u
left join public.accounts a on a.id = u.id;

do $$
begin
  if (select count(*) from _purge_users) = 0 then
    raise exception 'No auth.users row for that email. Check spelling or run list_auth_users.sql.';
  end if;
end $$;

create temp table _purge_trees on commit drop as
select ft.id
from public.family_trees ft
join _purge_users u on u.id = ft.created_by_account_id;

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

delete from public.accounts a using _purge_users u where a.id = u.id;

-- Remove identities first (sometimes helps when dashboard delete fails)
delete from auth.sessions s using _purge_users u where s.user_id::text = u.id::text;
delete from auth.refresh_tokens rt using _purge_users u where rt.user_id = u.id::text;
delete from auth.mfa_factors mf using _purge_users u where mf.user_id::text = u.id::text;
delete from auth.one_time_tokens ott using _purge_users u where ott.user_id::text = u.id::text;
delete from auth.identities i using _purge_users u where i.user_id = u.id;
delete from auth.users au using _purge_users u where au.id = u.id;

commit;

-- Should return 0 rows:
select id, email from auth.users where lower(email) = lower('elnomenest@gmail.com');
