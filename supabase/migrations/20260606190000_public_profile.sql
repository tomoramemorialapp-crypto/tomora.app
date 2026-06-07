-- Public profile: shareable /u/{username} pages, memory unlock, username hardening.
-- Safe to re-run (CREATE OR REPLACE / IF NOT EXISTS).

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Password gate for invite_link memories featured on a public profile.
ALTER TABLE public.memories
  ADD COLUMN IF NOT EXISTS share_password_hash text;

COMMENT ON COLUMN public.memories.share_password_hash IS
  'bcrypt hash for opening an invite_link memory from a public profile; null = no extra gate';

-- Case-insensitive unique username for active accounts (reinforces URL uniqueness).
CREATE UNIQUE INDEX IF NOT EXISTS accounts_username_lower_active_unique
  ON public.accounts (lower(username))
  WHERE username IS NOT NULL AND status = 'active';

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_reserved_username(p_username text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT lower(trim(p_username)) = ANY (ARRAY[
    'admin', 'api', 'www', 'tomora', 'support', 'help', 'login', 'settings',
    'u', 'claim', 'invite', 'welcome', 'profile', 'memorial', 'memory', 'memories',
    'family-tree', 'companion', 'occasions', 'notifications', 'auth', 'root',
    'null', 'undefined', 'about', 'privacy', 'terms', 'billing', 'delete',
    'signup', 'signin', 'register', 'account', 'accounts', 'node', 'nodes',
    'tree', 'trees', 'public', 'private', 'share', 'home', 'index', 'app'
  ]::text[]);
$$;

CREATE OR REPLACE FUNCTION public.normalize_username_input(p_username text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT lower(regexp_replace(trim(coalesce(p_username, '')), '[^a-z0-9_]', '', 'g'));
$$;

CREATE OR REPLACE FUNCTION public.filter_public_profile_fields(p_profile jsonb)
RETURNS jsonb
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  keys text[] := ARRAY[
    'profilePhoto', 'name', 'alternateNames', 'previousNames',
    'dateOfBirth', 'dateOfDeath', 'placeOfBirth', 'placeOfDeath',
    'genderSex', 'languages', 'notesHistory'
  ];
  k text;
  field jsonb;
  out jsonb := '{}'::jsonb;
BEGIN
  IF p_profile IS NULL OR jsonb_typeof(p_profile) <> 'object' THEN
    RETURN out;
  END IF;

  FOREACH k IN ARRAY keys LOOP
    field := p_profile -> k;
    IF field IS NOT NULL
       AND field ? 'visibility'
       AND field ->> 'visibility' = 'public'
       AND field ? 'value'
       AND field -> 'value' IS NOT NULL
       AND field -> 'value' <> 'null'::jsonb
    THEN
      out := out || jsonb_build_object(k, field -> 'value');
    END IF;
  END LOOP;

  RETURN out;
END;
$$;

-- ---------------------------------------------------------------------------
-- Username (owner-only, rate-limited, reserved list, case-insensitive unique)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.set_username(p_username text)
RETURNS public.accounts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_norm text;
  v_row public.accounts%ROWTYPE;
  v_changes timestamptz[];
  v_recent int;
  v_now timestamptz := now();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'NOT_SIGNED_IN';
  END IF;

  v_norm := public.normalize_username_input(p_username);

  IF v_norm !~ '^[a-z0-9_]{3,30}$' THEN
    RAISE EXCEPTION 'Username must be 3–30 characters: lowercase letters, numbers, and underscores only.';
  END IF;

  IF public.is_reserved_username(v_norm) THEN
    RAISE EXCEPTION 'That username is reserved.';
  END IF;

  SELECT * INTO v_row FROM public.accounts WHERE id = v_uid FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Account not found.';
  END IF;

  IF v_row.status <> 'active' THEN
    RAISE EXCEPTION 'Your account cannot change its username right now.';
  END IF;

  IF v_row.username IS NOT NULL AND lower(v_row.username) = v_norm THEN
    RETURN v_row;
  END IF;

  v_changes := coalesce(v_row.username_changes, ARRAY[]::timestamptz[]);
  SELECT count(*)::int INTO v_recent
  FROM unnest(v_changes) AS ts
  WHERE ts > v_now - interval '30 days';

  IF v_recent >= 2 THEN
    RAISE EXCEPTION 'You can change your username at most twice every 30 days.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.accounts a
    WHERE lower(a.username) = v_norm
      AND a.id <> v_uid
      AND a.status = 'active'
  ) THEN
    RAISE EXCEPTION 'That username isn''t available.';
  END IF;

  UPDATE public.accounts
  SET
    username = v_norm,
    username_changes = array_append(v_changes, v_now),
    updated_at = v_now
  WHERE id = v_uid
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION public.set_username(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_username(text) TO authenticated;

-- ---------------------------------------------------------------------------
-- Public profile reader (anonymous + authenticated)
-- ---------------------------------------------------------------------------

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
        CASE
          WHEN mem.share_password_hash IS NOT NULL THEN NULL
          WHEN mem.visibility = 'public' THEN mem.media_url
          ELSE NULL
        END AS media_url,
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

REVOKE ALL ON FUNCTION public.get_public_profile(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_profile(text) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- Unlock a password-gated memory from a public profile
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.unlock_public_memory(p_memory_id uuid, p_password text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_mem public.memories%ROWTYPE;
  v_owner public.accounts%ROWTYPE;
  v_pp jsonb;
  v_featured uuid[];
  v_on_profile boolean := false;
BEGIN
  SELECT * INTO v_mem
  FROM public.memories
  WHERE id = p_memory_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Memory not found.';
  END IF;

  IF v_mem.visibility NOT IN ('public', 'invite_link') THEN
    RAISE EXCEPTION 'This memory is not shared publicly.';
  END IF;

  SELECT * INTO v_owner
  FROM public.accounts
  WHERE id = v_mem.created_by_account_id
    AND status = 'active';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Memory not found.';
  END IF;

  v_pp := coalesce(v_owner.preferences -> 'publicProfile', '{}'::jsonb);
  IF NOT coalesce((v_pp ->> 'enabled')::boolean, false)
     OR NOT coalesce((v_pp ->> 'showMemories')::boolean, true)
  THEN
    RAISE EXCEPTION 'This memory is not on a public profile.';
  END IF;

  IF v_pp ? 'featuredMemoryIds' AND jsonb_typeof(v_pp -> 'featuredMemoryIds') = 'array'
     AND jsonb_array_length(v_pp -> 'featuredMemoryIds') > 0
  THEN
    SELECT coalesce(array_agg(elem::uuid), ARRAY[]::uuid[])
    INTO v_featured
    FROM jsonb_array_elements_text(v_pp -> 'featuredMemoryIds') AS elem;

    v_on_profile := v_mem.id = ANY (v_featured);
  ELSE
    v_on_profile := true;
  END IF;

  IF NOT v_on_profile THEN
    RAISE EXCEPTION 'This memory is not on a public profile.';
  END IF;

  IF v_mem.share_password_hash IS NULL THEN
    RETURN jsonb_build_object(
      'id', v_mem.id,
      'type', v_mem.type,
      'title', v_mem.title,
      'body', v_mem.body,
      'caption', v_mem.caption,
      'media_url', v_mem.media_url,
      'media', v_mem.media,
      'created_at', v_mem.created_at
    );
  END IF;

  IF coalesce(trim(p_password), '') = '' THEN
    RAISE EXCEPTION 'PASSWORD_REQUIRED';
  END IF;

  IF v_mem.share_password_hash <> crypt(p_password, v_mem.share_password_hash) THEN
    RAISE EXCEPTION 'Incorrect password.';
  END IF;

  RETURN jsonb_build_object(
    'id', v_mem.id,
    'type', v_mem.type,
    'title', v_mem.title,
    'body', v_mem.body,
    'caption', v_mem.caption,
    'media_url', v_mem.media_url,
    'media', v_mem.media,
    'created_at', v_mem.created_at
  );
END;
$$;

REVOKE ALL ON FUNCTION public.unlock_public_memory(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.unlock_public_memory(uuid, text) TO anon, authenticated;

-- Owner sets/clears share password on their public/invite_link memories.
CREATE OR REPLACE FUNCTION public.set_memory_share_password(p_memory_id uuid, p_password text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_mem public.memories%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'NOT_SIGNED_IN';
  END IF;

  SELECT * INTO v_mem
  FROM public.memories
  WHERE id = p_memory_id
    AND created_by_account_id = v_uid
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Memory not found.';
  END IF;

  IF v_mem.visibility NOT IN ('public', 'invite_link') THEN
    RAISE EXCEPTION 'Only public or link-shared memories can have a share password.';
  END IF;

  IF coalesce(trim(p_password), '') = '' THEN
    UPDATE public.memories
    SET share_password_hash = NULL, updated_at = now()
    WHERE id = p_memory_id;
    RETURN;
  END IF;

  IF length(p_password) < 4 OR length(p_password) > 128 THEN
    RAISE EXCEPTION 'Password must be 4–128 characters.';
  END IF;

  UPDATE public.memories
  SET share_password_hash = crypt(p_password, gen_salt('bf')), updated_at = now()
  WHERE id = p_memory_id;
END;
$$;

REVOKE ALL ON FUNCTION public.set_memory_share_password(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_memory_share_password(uuid, text) TO authenticated;

-- Probe for migration checker
CREATE OR REPLACE FUNCTION public.public_profile_supports_v2()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'memories'
      AND column_name = 'share_password_hash'
  )
  AND EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'unlock_public_memory'
  );
$$;

GRANT EXECUTE ON FUNCTION public.public_profile_supports_v2() TO anon, authenticated;
