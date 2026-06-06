-- List every auth user + linked Tomora account (run in SQL Editor).
-- Use this to copy exact Gmail addresses before running purge_test_users.sql.

select
  u.id,
  u.email,
  u.created_at,
  u.email_confirmed_at,
  u.last_sign_in_at,
  a.username,
  a.display_name,
  (select count(*) from public.family_trees ft where ft.created_by_account_id = u.id) as trees_created,
  (select count(*) from public.tree_memberships tm where tm.account_id = u.id) as tree_memberships
from auth.users u
left join public.accounts a on a.id = u.id
order by u.created_at desc;
