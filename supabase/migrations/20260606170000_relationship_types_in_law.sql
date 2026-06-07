-- Allow step-parent and in-law relationship types (child_in_law, parent_in_law, step_parent).
-- The MVP schema CHECK enum omitted these; inserts returned HTTP 400 from PostgREST.

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
    -- Postgres enum column — add missing labels (no-op if already present).
    BEGIN EXECUTE format('ALTER TYPE public.%I ADD VALUE IF NOT EXISTS %L', col_udt, 'step_parent'); EXCEPTION WHEN others THEN NULL; END;
    BEGIN EXECUTE format('ALTER TYPE public.%I ADD VALUE IF NOT EXISTS %L', col_udt, 'parent_in_law'); EXCEPTION WHEN others THEN NULL; END;
    BEGIN EXECUTE format('ALTER TYPE public.%I ADD VALUE IF NOT EXISTS %L', col_udt, 'child_in_law'); EXCEPTION WHEN others THEN NULL; END;
  ELSE
    -- Text column with CHECK — drop old constraint(s) referencing relationship_type.
    FOR r IN
      SELECT conname
      FROM pg_constraint
      WHERE conrelid = 'public.relationships'::regclass
        AND contype = 'c'
        AND pg_get_constraintdef(oid) ILIKE '%relationship_type%'
    LOOP
      EXECUTE format('ALTER TABLE public.relationships DROP CONSTRAINT IF EXISTS %I', r.conname);
    END LOOP;

    ALTER TABLE public.relationships
      ADD CONSTRAINT relationships_relationship_type_check
      CHECK (relationship_type IN (
        'self',
        'parent',
        'step_parent',
        'parent_in_law',
        'child',
        'child_in_law',
        'sibling',
        'grandparent',
        'grandchild',
        'aunt_uncle',
        'niece_nephew',
        'cousin',
        'spouse',
        'partner',
        'friend',
        'pet',
        'caretaker',
        'chosen_family',
        'other'
      ));
  END IF;
END $$;

COMMENT ON COLUMN public.relationships.relationship_type IS
  'Kinship category from the from_node perspective. Includes step_parent, parent_in_law, child_in_law.';

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
