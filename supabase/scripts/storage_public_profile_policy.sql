-- Allow signed URL reads for media files featured on an enabled public profile.
--
-- The Supabase SQL Editor cannot ALTER storage.objects (42501: must be owner).
-- Apply ONE of these options:
--
-- Option A — Dashboard (recommended)
--   1. Supabase Dashboard → Storage → media bucket → Policies
--   2. New policy → "For full customization" / custom
--   3. Name: public_profile_media_read
--   4. Allowed operation: SELECT
--   5. Target roles: anon, authenticated
--   6. USING expression:
--        bucket_id = 'media'
--        AND public.storage_object_on_public_profile(name)
--
-- Option B — CLI (project owner / supabase db push only, not SQL Editor)
--   supabase db push
--   or run this file with a role that owns storage.objects
--
-- Requires migration 20260606200000 (storage_object_on_public_profile function).

DROP POLICY IF EXISTS public_profile_media_read ON storage.objects;

CREATE POLICY public_profile_media_read ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (
    bucket_id = 'media'
    AND public.storage_object_on_public_profile(name)
  );
