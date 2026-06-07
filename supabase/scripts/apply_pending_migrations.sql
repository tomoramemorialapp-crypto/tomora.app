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
      ('20260606180000', 'nodes_status_deleted')
    ON CONFLICT (version) DO NOTHING;
  END IF;
END $$;
