-- Fix: the existing SELECT policy on storage.objects tries to cast the first
-- folder segment to UUID unconditionally. This fails with 22P02 when files
-- are stored under non-UUID prefixes like 'promotions/'.
-- Add a regex guard so the UUID cast only happens for UUID-shaped folder names.

DROP POLICY "Enrolled users can read course assets" ON storage.objects;

CREATE POLICY "Enrolled users can read course assets"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'course-assets'
  AND (
    (
      (storage.foldername(name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      AND public.is_enrolled((storage.foldername(name))[1]::UUID)
    )
    OR public.has_role(auth.uid(), 'admin')
  )
);
