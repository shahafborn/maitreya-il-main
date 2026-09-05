-- Uma Zub Tri session 3 (Saturday, August 15 2026) recording.
-- Source: Shahaf's local Zoom capture, 1920x1080, 82:58 - the course runs on the
-- organizer's Zoom, so it never reaches the Sangha cloud account.
-- Bunny library 718352, video 3aebc232-3f51-4294-b351-5a5c875624f4.
--
-- Guarded on week_number so a re-run cannot duplicate the row
-- (course_recordings has no natural unique key for ON CONFLICT).

INSERT INTO public.course_recordings
  (course_id, week_number, session_type, title, embed_type, embed_url, sort_order)
SELECT
  c.id,
  3,
  NULL,
  'Session 3 - Saturday, August 15, 2026',
  'bunny',
  'https://iframe.mediadelivery.net/embed/718352/3aebc232-3f51-4294-b351-5a5c875624f4?autoplay=false&loop=false&muted=false&preload=true&responsive=true',
  2
FROM public.courses c
WHERE c.slug = 'uma-zub-tri'
  AND NOT EXISTS (
    SELECT 1 FROM public.course_recordings r
    WHERE r.course_id = c.id AND r.week_number = 3
  );
