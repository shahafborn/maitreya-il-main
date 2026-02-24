-- Add language column to promotions (determines direction + UI labels)
ALTER TABLE public.promotions
  ADD COLUMN language TEXT NOT NULL DEFAULT 'he'
    CHECK (language IN ('he', 'en'));

-- Replace image_url with image_storage_path for uploaded images
ALTER TABLE public.promotions
  RENAME COLUMN image_url TO image_storage_path;

-- Storage: allow all authenticated users to read promotion images
CREATE POLICY "Authenticated users can read promotion images"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'course-assets'
  AND (storage.foldername(name))[1] = 'promotions'
);
