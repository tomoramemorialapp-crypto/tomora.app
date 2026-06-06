-- Resolve a login identifier (email or username) to the auth email address.
-- Used client-side before signInWithPassword — Supabase Auth requires email.
create or replace function public.resolve_login_email(p_identifier text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_trimmed text := trim(p_identifier);
  v_lower text := lower(v_trimmed);
  v_email text;
begin
  if v_trimmed = '' then
    raise exception 'Enter your email or username.';
  end if;

  -- Pass through valid email addresses unchanged.
  if v_trimmed ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    return lower(v_trimmed);
  end if;

  -- Look up auth email via the unique accounts.username column.
  select au.email into v_email
  from public.accounts a
  join auth.users au on au.id = a.id
  where lower(a.username) = v_lower
  limit 1;

  if v_email is null then
    raise exception 'No account found for that username or email.';
  end if;

  return lower(v_email);
end;
$$;

revoke all on function public.resolve_login_email(text) from public;
grant execute on function public.resolve_login_email(text) to anon, authenticated;
