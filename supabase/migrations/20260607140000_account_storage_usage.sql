-- Accurate per-account storage usage from the private media bucket (all uploads).

CREATE OR REPLACE FUNCTION public.account_storage_bytes_used(p_account_id uuid)
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, storage
AS $$
  SELECT coalesce(sum(coalesce((metadata ->> 'size')::bigint, 0)), 0)
  FROM storage.objects
  WHERE bucket_id = 'media'
    AND name LIKE p_account_id::text || '/%';
$$;

CREATE OR REPLACE FUNCTION public.get_account_storage_bytes(p_account_id uuid)
RETURNS bigint
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, storage
AS $$
BEGIN
  IF auth.uid() IS NULL OR p_account_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;

  RETURN public.account_storage_bytes_used(p_account_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.assert_storage_quota(p_account_id uuid, p_add_bytes bigint)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, storage
AS $$
DECLARE
  v_used bigint;
  v_quota bigint := 1073741824; -- 1 GB
BEGIN
  IF p_add_bytes IS NULL OR p_add_bytes < 0 THEN
    RETURN;
  END IF;

  v_used := public.account_storage_bytes_used(p_account_id);

  IF v_used + p_add_bytes > v_quota THEN
    RAISE EXCEPTION 'STORAGE_QUOTA_EXCEEDED';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.account_storage_bytes_used(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_account_storage_bytes(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.assert_storage_quota(uuid, bigint) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.get_account_storage_bytes(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.assert_storage_quota(uuid, bigint) TO authenticated;
