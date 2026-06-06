-- Soft-delete nodes so they stay in the database for audit but disappear from selectors.
alter table public.nodes
  add column if not exists deleted_at timestamptz,
  add column if not exists deleted_by uuid references public.accounts(id) on delete set null;

comment on column public.nodes.deleted_at is
  'When set, the node is excluded from active tree UI and selectors.';
comment on column public.nodes.deleted_by is
  'Account that removed the node from the active Family Tree.';

create index if not exists nodes_family_tree_active_idx
  on public.nodes (family_tree_id)
  where deleted_at is null;
