-- =============================================================================
-- Apply pending Tomora migrations (safe to re-run — uses IF NOT EXISTS / OR REPLACE)
--
-- Missing on remote as of last check:
--   • 20260606150000_peek_invite_code
--   • 20260606160000_claim_security
--   • 20260606170000_relationship_types_in_law
--   • 20260606180000_nodes_status_deleted
--
-- Run in: Supabase Dashboard → SQL Editor → New query → paste → Run
-- Or:     $env:SUPABASE_DB_PASSWORD="…"; npm run db:apply-pending
-- =============================================================================

-- ── 20260606150000 peek_invite_code (superseded below by hardened version) ──

CREATE OR REPLACE FUNCTION public.peek_invite_code(p_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_node nodes%ROWTYPE;
  v_tree family_trees%ROWTYPE;
  v_inviter text;
  v_relationship text;
BEGIN
  SELECT * INTO v_node
  FROM nodes
  WHERE upper(trim(invite_code)) = upper(trim(p_code))
    AND invite_code IS NOT NULL
    AND deleted_at IS NULL
    AND status NOT IN ('deleted', 'archived', 'vacated')
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'INVALID_CODE');
  END IF;

  IF v_node.owner_account_id IS NOT NULL OR v_node.status = 'claimed' THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'ALREADY_CLAIMED');
  END IF;

  IF v_node.invite_locked_at IS NOT NULL THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'INVITE_LOCKED');
  END IF;

  IF v_node.invite_expires_at IS NOT NULL AND v_node.invite_expires_at < now() THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'INVITE_EXPIRED');
  END IF;

  SELECT * INTO v_tree FROM family_trees WHERE id = v_node.family_tree_id;

  SELECT coalesce(a.display_name, 'Someone in your family')
  INTO v_inviter
  FROM tree_memberships m
  JOIN accounts a ON a.id = m.account_id
  WHERE m.family_tree_id = v_node.family_tree_id
    AND m.role IN ('owner', 'creator')
  ORDER BY CASE m.role WHEN 'owner' THEN 0 WHEN 'creator' THEN 1 ELSE 2 END
  LIMIT 1;

  IF v_inviter IS NULL AND v_node.invited_by_account_id IS NOT NULL THEN
    SELECT display_name INTO v_inviter FROM accounts WHERE id = v_node.invited_by_account_id;
  END IF;

  SELECT r.relationship_type INTO v_relationship
  FROM relationships r
  WHERE (r.to_node_id = v_node.id OR r.from_node_id = v_node.id)
    AND r.status = 'approved'
  ORDER BY r.created_at
  LIMIT 1;

  RETURN jsonb_build_object(
    'valid', true,
    'node_id', v_node.id,
    'family_tree_id', v_node.family_tree_id,
    'display_name', v_node.display_name,
    'inviter_name', coalesce(v_inviter, 'Someone in your family'),
    'tree_name', coalesce(v_tree.name, 'Family Tree'),
    'requires_password', (v_node.claim_password IS NOT NULL AND length(trim(v_node.claim_password)) > 0),
    'relationship_type', v_relationship
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.peek_invite_code(text) TO anon, authenticated;

-- ── 20260606160000 claim_security ──

ALTER TABLE public.nodes
  ADD COLUMN IF NOT EXISTS invite_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS invite_failed_attempts integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS invite_locked_at timestamptz,
  ADD COLUMN IF NOT EXISTS invite_used_at timestamptz,
  ADD COLUMN IF NOT EXISTS invite_used_by_account_id uuid REFERENCES public.accounts(id),
  ADD COLUMN IF NOT EXISTS invited_by_account_id uuid REFERENCES public.accounts(id);

CREATE TABLE IF NOT EXISTS public.node_transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id uuid NOT NULL REFERENCES public.nodes(id) ON DELETE CASCADE,
  family_tree_id uuid NOT NULL REFERENCES public.family_trees(id) ON DELETE CASCADE,
  from_account_id uuid NOT NULL REFERENCES public.accounts(id),
  to_email text NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'cancelled', 'expired')),
  created_at timestamptz NOT NULL DEFAULT now(),
  accepted_at timestamptz,
  accepted_by_account_id uuid REFERENCES public.accounts(id),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '14 days')
);

ALTER TABLE public.node_transfers ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS node_transfers_node_id_idx ON public.node_transfers(node_id);
CREATE INDEX IF NOT EXISTS node_transfers_to_email_idx ON public.node_transfers(lower(to_email));

UPDATE public.nodes
SET invite_expires_at = now() + interval '90 days'
WHERE invite_code IS NOT NULL AND invite_expires_at IS NULL;

CREATE OR REPLACE FUNCTION public.claim_node(p_code text, p_password text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid;
  v_node nodes%ROWTYPE;
  v_attempts integer;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'NOT_SIGNED_IN';
  END IF;

  SELECT * INTO v_node
  FROM nodes
  WHERE upper(trim(invite_code)) = upper(trim(p_code))
    AND invite_code IS NOT NULL
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'INVALID_CODE';
  END IF;

  IF v_node.deleted_at IS NOT NULL OR v_node.status IN ('deleted', 'archived', 'vacated') THEN
    RAISE EXCEPTION 'INVALID_CODE';
  END IF;

  IF v_node.owner_account_id IS NOT NULL OR v_node.status = 'claimed' THEN
    RAISE EXCEPTION 'ALREADY_CLAIMED';
  END IF;

  IF v_node.invite_locked_at IS NOT NULL THEN
    RAISE EXCEPTION 'INVITE_LOCKED';
  END IF;

  IF v_node.invite_expires_at IS NOT NULL AND v_node.invite_expires_at < now() THEN
    RAISE EXCEPTION 'INVITE_EXPIRED';
  END IF;

  IF v_node.claim_password IS NOT NULL AND length(trim(v_node.claim_password)) > 0 THEN
    IF p_password IS NULL OR trim(p_password) <> trim(v_node.claim_password) THEN
      v_attempts := coalesce(v_node.invite_failed_attempts, 0) + 1;
      UPDATE nodes
      SET invite_failed_attempts = v_attempts,
          invite_locked_at = CASE WHEN v_attempts >= 5 THEN now() ELSE invite_locked_at END,
          updated_at = now()
      WHERE id = v_node.id;
      RAISE EXCEPTION 'BAD_PASSWORD';
    END IF;
  END IF;

  UPDATE nodes
  SET owner_account_id = v_uid,
      status = 'claimed',
      invite_code = NULL,
      claim_password = NULL,
      invite_used_at = now(),
      invite_used_by_account_id = v_uid,
      invite_failed_attempts = 0,
      invite_locked_at = NULL,
      updated_at = now()
  WHERE id = v_node.id;

  INSERT INTO tree_memberships (family_tree_id, account_id, role, status)
  SELECT v_node.family_tree_id, v_uid, 'member', 'active'
  WHERE NOT EXISTS (
    SELECT 1 FROM tree_memberships
    WHERE family_tree_id = v_node.family_tree_id AND account_id = v_uid
  );

  RETURN jsonb_build_object(
    'node_id', v_node.id,
    'family_tree_id', v_node.family_tree_id,
    'display_name', v_node.display_name
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.request_node_transfer(p_node_id uuid, p_to_email text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid;
  v_node nodes%ROWTYPE;
  v_transfer_id uuid;
  v_email text;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'NOT_SIGNED_IN';
  END IF;

  v_email := lower(trim(p_to_email));
  IF v_email = '' OR position('@' in v_email) = 0 THEN
    RAISE EXCEPTION 'INVALID_EMAIL';
  END IF;

  SELECT * INTO v_node FROM nodes WHERE id = p_node_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'NODE_NOT_FOUND';
  END IF;

  IF v_node.owner_account_id IS DISTINCT FROM v_uid THEN
    RAISE EXCEPTION 'NOT_OWNER';
  END IF;

  UPDATE node_transfers
  SET status = 'cancelled'
  WHERE node_id = p_node_id AND status = 'pending';

  INSERT INTO node_transfers (node_id, family_tree_id, from_account_id, to_email)
  VALUES (v_node.id, v_node.family_tree_id, v_uid, v_email)
  RETURNING id INTO v_transfer_id;

  RETURN jsonb_build_object('transfer_id', v_transfer_id, 'expires_at', now() + interval '14 days');
END;
$$;

CREATE OR REPLACE FUNCTION public.accept_node_transfer(p_transfer_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid;
  v_email text;
  v_transfer node_transfers%ROWTYPE;
  v_node nodes%ROWTYPE;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'NOT_SIGNED_IN';
  END IF;

  SELECT email INTO v_email FROM auth.users WHERE id = v_uid;
  IF v_email IS NULL OR lower(trim(v_email)) = '' THEN
    RAISE EXCEPTION 'EMAIL_REQUIRED';
  END IF;

  SELECT * INTO v_transfer FROM node_transfers WHERE id = p_transfer_id FOR UPDATE;
  IF NOT FOUND OR v_transfer.status <> 'pending' THEN
    RAISE EXCEPTION 'TRANSFER_NOT_FOUND';
  END IF;

  IF v_transfer.expires_at < now() THEN
    UPDATE node_transfers SET status = 'expired' WHERE id = p_transfer_id;
    RAISE EXCEPTION 'TRANSFER_EXPIRED';
  END IF;

  IF lower(trim(v_transfer.to_email)) <> lower(trim(v_email)) THEN
    RAISE EXCEPTION 'EMAIL_MISMATCH';
  END IF;

  SELECT * INTO v_node FROM nodes WHERE id = v_transfer.node_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'NODE_NOT_FOUND';
  END IF;

  UPDATE nodes
  SET owner_account_id = v_uid,
      status = 'claimed',
      invite_code = NULL,
      claim_password = NULL,
      updated_at = now()
  WHERE id = v_node.id;

  UPDATE node_transfers
  SET status = 'accepted',
      accepted_at = now(),
      accepted_by_account_id = v_uid
  WHERE id = p_transfer_id;

  INSERT INTO tree_memberships (family_tree_id, account_id, role, status)
  SELECT v_node.family_tree_id, v_uid, 'member', 'active'
  WHERE NOT EXISTS (
    SELECT 1 FROM tree_memberships
    WHERE family_tree_id = v_node.family_tree_id AND account_id = v_uid
  );

  RETURN jsonb_build_object('node_id', v_node.id, 'display_name', v_node.display_name);
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_node(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.request_node_transfer(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_node_transfer(uuid) TO authenticated;

-- ── 20260606170000 relationship_types_in_law ─────────────────────────────────

DO $$
DECLARE
  col_udt text;
  r RECORD;
BEGIN
  SELECT udt_name INTO col_udt
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'relationships'
    AND column_name = 'relationship_type';

  IF col_udt IS NOT NULL AND col_udt <> 'text' AND col_udt <> 'varchar' THEN
    BEGIN EXECUTE format('ALTER TYPE public.%I ADD VALUE IF NOT EXISTS %L', col_udt, 'step_parent'); EXCEPTION WHEN others THEN NULL; END;
    BEGIN EXECUTE format('ALTER TYPE public.%I ADD VALUE IF NOT EXISTS %L', col_udt, 'parent_in_law'); EXCEPTION WHEN others THEN NULL; END;
    BEGIN EXECUTE format('ALTER TYPE public.%I ADD VALUE IF NOT EXISTS %L', col_udt, 'child_in_law'); EXCEPTION WHEN others THEN NULL; END;
  ELSE
    FOR r IN
      SELECT conname
      FROM pg_constraint
      WHERE conrelid = 'public.relationships'::regclass
        AND contype = 'c'
        AND pg_get_constraintdef(oid) ILIKE '%relationship_type%'
    LOOP
      EXECUTE format('ALTER TABLE public.relationships DROP CONSTRAINT IF EXISTS %I', r.conname);
    END LOOP;

    ALTER TABLE public.relationships DROP CONSTRAINT IF EXISTS relationships_relationship_type_check;
    ALTER TABLE public.relationships
      ADD CONSTRAINT relationships_relationship_type_check
      CHECK (relationship_type IN (
        'self', 'parent', 'step_parent', 'parent_in_law', 'child', 'child_in_law',
        'sibling', 'grandparent', 'grandchild', 'aunt_uncle', 'niece_nephew', 'cousin',
        'spouse', 'partner', 'friend', 'pet', 'caretaker', 'chosen_family', 'other'
      ));
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.relationship_types_supports_in_law()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.relationships'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%child_in_law%'
  )
  OR EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = (
      SELECT udt_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'relationships'
        AND column_name = 'relationship_type'
      LIMIT 1
    )
    AND e.enumlabel = 'child_in_law'
  );
$$;

GRANT EXECUTE ON FUNCTION public.relationship_types_supports_in_law() TO anon, authenticated;

-- ── 20260606180000 nodes_status_deleted ───────────────────────────────────────

DO $$
DECLARE
  col_udt text;
  r RECORD;
BEGIN
  SELECT udt_name INTO col_udt
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'nodes'
    AND column_name = 'status';

  IF col_udt IS NOT NULL AND col_udt <> 'text' AND col_udt <> 'varchar' THEN
    BEGIN EXECUTE format('ALTER TYPE public.%I ADD VALUE IF NOT EXISTS %L', col_udt, 'deleted'); EXCEPTION WHEN others THEN NULL; END;
  ELSE
    FOR r IN
      SELECT conname
      FROM pg_constraint
      WHERE conrelid = 'public.nodes'::regclass
        AND contype = 'c'
        AND pg_get_constraintdef(oid) ILIKE '%status%'
    LOOP
      EXECUTE format('ALTER TABLE public.nodes DROP CONSTRAINT IF EXISTS %I', r.conname);
    END LOOP;

    ALTER TABLE public.nodes
      ADD CONSTRAINT nodes_status_check
      CHECK (status IN (
        'placeholder',
        'invited',
        'claim_pending',
        'claimed',
        'managed',
        'memorial_pending',
        'memory_light',
        'disputed',
        'archived',
        'vacated',
        'deleted'
      ));
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.nodes_status_supports_deleted()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.nodes'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%deleted%'
      AND pg_get_constraintdef(oid) ILIKE '%status%'
  )
  OR EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = (
      SELECT udt_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'nodes'
        AND column_name = 'status'
      LIMIT 1
    )
    AND e.enumlabel = 'deleted'
  );
$$;

GRANT EXECUTE ON FUNCTION public.nodes_status_supports_deleted() TO anon, authenticated;

-- Record migration history for Supabase CLI (if the table exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'supabase_migrations' AND table_name = 'schema_migrations'
  ) THEN
    INSERT INTO supabase_migrations.schema_migrations(version, name)
    VALUES
      ('20260606150000', 'peek_invite_code'),
      ('20260606160000', 'claim_security'),
      ('20260606170000', 'relationship_types_in_law'),
      ('20260606180000', 'nodes_status_deleted'),
      ('20260606190000', 'public_profile'),
      ('20260606200000', 'public_memory_media_access')
    ON CONFLICT (version) DO NOTHING;
  END IF;
END $$;

-- =============================================================================
-- 20260606190000_public_profile.sql
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE public.memories
  ADD COLUMN IF NOT EXISTS share_password_hash text;

COMMENT ON COLUMN public.memories.share_password_hash IS
  'bcrypt hash for opening an invite_link memory from a public profile; null = no extra gate';

CREATE UNIQUE INDEX IF NOT EXISTS accounts_username_lower_active_unique
  ON public.accounts (lower(username))
  WHERE username IS NOT NULL AND status = 'active';

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

-- =============================================================================
-- 20260606200000_public_memory_media_access.sql
-- =============================================================================

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

-- =============================================================================
-- 20260607130000_public_social_links_v2.sql
-- =============================================================================

CREATE OR REPLACE FUNCTION public.filter_public_social_links(p_links jsonb)
RETURNS jsonb
LANGUAGE sql
STABLE
AS $$
  SELECT CASE
    WHEN p_links IS NULL OR p_links = '{}'::jsonb THEN '{}'::jsonb
    WHEN coalesce(p_links ->> 'version', '') = '2' THEN jsonb_build_object(
      'version', 2,
      'items', coalesce(
        (
          SELECT jsonb_agg(elem ORDER BY ord)
          FROM jsonb_array_elements(coalesce(p_links -> 'items', '[]'::jsonb)) WITH ORDINALITY AS t(elem, ord)
          WHERE coalesce(elem ->> 'visibility', 'public') = 'public'
            AND nullif(trim(both from coalesce(elem ->> 'url', '')), '') IS NOT NULL
        ),
        '[]'::jsonb
      )
    )
    ELSE (
      SELECT coalesce(jsonb_object_agg(key, value), '{}'::jsonb)
      FROM jsonb_each(p_links) AS e(key, value)
      WHERE key NOT IN ('version', 'items')
        AND jsonb_typeof(value) = 'string'
        AND nullif(trim(both from value #>> '{}'), '') IS NOT NULL
    )
  END;
$$;

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
    'socialLinks', CASE
      WHEN v_show_social THEN public.filter_public_social_links(coalesce(v_account.social_links, '{}'::jsonb))
      ELSE '{}'::jsonb
    END,
    'lifeProfile', CASE
      WHEN v_show_life AND v_node.profile IS NOT NULL THEN public.filter_public_profile_fields(v_node.profile)
      ELSE '{}'::jsonb
    END,
    'memories', v_memories
  );
END;
$$;

REVOKE ALL ON FUNCTION public.filter_public_social_links(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.filter_public_social_links(jsonb) TO authenticated;

-- =============================================================================
-- 20260607140000_account_storage_usage.sql
-- =============================================================================

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
