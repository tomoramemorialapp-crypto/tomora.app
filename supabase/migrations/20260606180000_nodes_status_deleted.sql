-- Allow soft-deleted nodes to set status = 'deleted' (used with deleted_at / deleted_by).
-- Without this, PATCH updates fail with nodes_status_check violation (HTTP 400).

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
