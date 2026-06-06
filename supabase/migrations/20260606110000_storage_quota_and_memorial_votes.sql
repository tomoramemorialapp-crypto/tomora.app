-- Enforce per-account media storage quota (1 GB) before new uploads are saved.
create or replace function public.assert_storage_quota(p_account_id uuid, p_add_bytes bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_used bigint;
  v_quota bigint := 1073741824; -- 1 GB
begin
  if p_add_bytes is null or p_add_bytes < 0 then
    return;
  end if;

  select coalesce(sum(media_size_bytes), 0)
    into v_used
  from public.memories
  where created_by_account_id = p_account_id;

  if v_used + p_add_bytes > v_quota then
    raise exception 'STORAGE_QUOTA_EXCEEDED';
  end if;
end;
$$;

revoke all on function public.assert_storage_quota(uuid, bigint) from public;
grant execute on function public.assert_storage_quota(uuid, bigint) to authenticated;

-- One vote per member per memorial request.
create unique index if not exists memorial_votes_request_account_uidx
  on public.memorial_votes (request_id, account_id);
