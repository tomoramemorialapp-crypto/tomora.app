-- Public profile memory media: return media metadata in RPCs + allow signed URL reads.

CREATE OR REPLACE FUNCTION public.storage_object_on_public_profile(p_path text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.memories mem
    JOIN public.accounts acc ON acc.id = mem.created_by_account_id
    WHERE acc.status = 'active'
      AND coalesce((acc.preferences -> 'publicProfile' ->> 'enabled')::boolean, false)
      AND coalesce((acc.preferences -> 'publicProfile' ->> 'showMemories')::boolean, true)
      AND mem.visibility IN ('public', 'invite_link')
      AND (
        mem.storage_path = p_path
        OR EXISTS (
          SELECT 1
          FROM jsonb_array_elements(coalesce(mem.media, '[]'::jsonb)) elem
          WHERE elem ->> 'storagePath' = p_path
        )
      )
  );
$$;

-- Storage policy on storage.objects cannot be created from the Supabase SQL Editor
-- (ERROR 42501: must be owner of table objects). Apply it separately:
--   supabase/scripts/storage_public_profile_policy.sql
-- via Dashboard → Storage → media → Policies, or `supabase db push` (not SQL Editor).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'storage' AND table_name = 'objects'
  ) THEN
    BEGIN
      DROP POLICY IF EXISTS public_profile_media_read ON storage.objects;
      CREATE POLICY public_profile_media_read ON storage.objects
        FOR SELECT
        TO anon, authenticated
        USING (
          bucket_id = 'media'
          AND public.storage_object_on_public_profile(name)
        );
    EXCEPTION
      WHEN insufficient_privilege THEN
        RAISE NOTICE 'Skipped storage policy (insufficient_privilege). Run supabase/scripts/storage_public_profile_policy.sql via Storage Policies UI or supabase db push.';
    END;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.get_public_profile(p_username text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_norm text;
  v_account public.accounts%ROWTYPE;
  v_pp jsonb;
  v_node public.nodes%ROWTYPE;
  v_memories jsonb := '[]'::jsonb;
  v_featured uuid[];
  v_show_memories boolean;
  v_show_social boolean;
  v_show_life boolean;
BEGIN
  v_norm := public.normalize_username_input(p_username);
  IF v_norm !~ '^[a-z0-9_]{3,30}$' THEN
    RETURN NULL;
  END IF;

  SELECT * INTO v_account
  FROM public.accounts
  WHERE lower(username) = v_norm
    AND status = 'active'
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  v_pp := coalesce(v_account.preferences -> 'publicProfile', '{}'::jsonb);

  IF NOT coalesce((v_pp ->> 'enabled')::boolean, false) THEN
    RETURN NULL;
  END IF;

  v_show_social := coalesce((v_pp ->> 'showSocial')::boolean, true);
  v_show_memories := coalesce((v_pp ->> 'showMemories')::boolean, true);
  v_show_life := coalesce((v_pp ->> 'showLifeProfile')::boolean, true);

  SELECT * INTO v_node
  FROM public.nodes
  WHERE owner_account_id = v_account.id
    AND deleted_at IS NULL
  ORDER BY created_at
  LIMIT 1;

  IF v_show_memories THEN
    IF v_pp ? 'featuredMemoryIds'
       AND jsonb_typeof(v_pp -> 'featuredMemoryIds') = 'array'
       AND jsonb_array_length(v_pp -> 'featuredMemoryIds') > 0
    THEN
      SELECT coalesce(array_agg(elem::uuid), ARRAY[]::uuid[])
      INTO v_featured
      FROM jsonb_array_elements_text(v_pp -> 'featuredMemoryIds') AS elem;
    ELSE
      v_featured := NULL;
    END IF;

    SELECT coalesce(jsonb_agg(row_to_json(m)::jsonb ORDER BY m.sort_ord, m.created_at DESC), '[]'::jsonb)
    INTO v_memories
    FROM (
      SELECT
        mem.id,
        mem.type,
        mem.title,
        mem.caption,
        CASE WHEN mem.share_password_hash IS NULL THEN mem.body ELSE NULL END AS body,
        CASE WHEN mem.share_password_hash IS NULL THEN mem.media_url ELSE NULL END AS media_url,
        CASE WHEN mem.share_password_hash IS NULL THEN coalesce(mem.media, '[]'::jsonb) ELSE '[]'::jsonb END AS media,
        CASE WHEN mem.share_password_hash IS NULL THEN mem.storage_path ELSE NULL END AS storage_path,
        mem.created_at,
        mem.visibility,
        (mem.share_password_hash IS NOT NULL) AS requires_password,
        CASE
          WHEN v_featured IS NOT NULL THEN array_position(v_featured, mem.id)
          ELSE 0
        END AS sort_ord
      FROM public.memories mem
      WHERE mem.created_by_account_id = v_account.id
        AND mem.approval_status IN ('approved', 'draft')
        AND mem.visibility IN ('public', 'invite_link')
        AND (
          v_featured IS NULL
          OR mem.id = ANY (v_featured)
        )
      ORDER BY sort_ord NULLS LAST, mem.created_at DESC
      LIMIT 24
    ) m;
  END IF;

  RETURN jsonb_build_object(
    'displayName', v_account.display_name,
    'username', v_account.username,
    'avatarUrl', coalesce(v_account.avatar_url, v_node.avatar_url),
    'bannerUrl', nullif(v_pp ->> 'bannerUrl', ''),
    'bio', nullif(v_pp ->> 'bio', ''),
    'showSocial', v_show_social,
    'showLifeProfile', v_show_life,
    'socialLinks', CASE WHEN v_show_social THEN coalesce(v_account.social_links, '{}'::jsonb) ELSE '{}'::jsonb END,
    'lifeProfile', CASE
      WHEN v_show_life AND v_node.profile IS NOT NULL THEN public.filter_public_profile_fields(v_node.profile)
      ELSE '{}'::jsonb
    END,
    'memories', v_memories
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.public_profile_media_access_enabled()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'storage_object_on_public_profile'
  );
$$;

GRANT EXECUTE ON FUNCTION public.public_profile_media_access_enabled() TO anon, authenticated;
