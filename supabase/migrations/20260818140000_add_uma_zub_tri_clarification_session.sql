-- Uma Zub Tri clarification session with Drupon Chongwol-la (Sunday, August 16 2026).
-- Not one of the six Saturday sessions with Lama Glenn - a separate Q&A meeting on
-- the material so far, held in the course Zoom room at 18:00 Israel time.
-- Source: Shahaf's local Zoom capture, 73:30, same reason as the Saturday ones -
-- the course runs on the organizer's Zoom, so nothing reaches the Sangha cloud account.
-- Bunny library 718352, video e8e24abf-8e14-4ef3-b684-cf4e7987dd55.
--
-- Sits under week 3 with session_type 'clarification', matching how the
-- Intro to Tantra course pairs a main teaching with its clarification.
-- Guarded on (week_number, session_type) so a re-run cannot duplicate the row.

INSERT INTO public.course_recordings
  (course_id, week_number, session_type, title, embed_type, embed_url, sort_order)
SELECT
  c.id,
  3,
  'clarification',
  'Clarification Session with Drupon Chongwol-la - Sunday, August 16, 2026',
  'bunny',
  'https://iframe.mediadelivery.net/embed/718352/e8e24abf-8e14-4ef3-b684-cf4e7987dd55?autoplay=false&loop=false&muted=false&preload=true&responsive=true',
  (SELECT COALESCE(MAX(r2.sort_order), -1) + 1
   FROM public.course_recordings r2 WHERE r2.course_id = c.id)
FROM public.courses c
WHERE c.slug = 'uma-zub-tri'
  AND NOT EXISTS (
    SELECT 1 FROM public.course_recordings r
    WHERE r.course_id = c.id AND r.week_number = 3
      AND r.session_type = 'clarification'
  );
