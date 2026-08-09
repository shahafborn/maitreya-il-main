-- Course resource page for the Uma Zub Tri Mahamudra series (Lama Glenn Mullin).
-- Six weekly Saturday sessions, Aug 1 - Sep 5 2026. Mirrors seed_intro_to_tantra:
-- recordings are added week by week as each session is uploaded to Bunny.

INSERT INTO public.courses (
  slug, title, description, is_published, access_code, default_dir, course_start_date
)
VALUES (
  'uma-zub-tri',
  'UMA ZUB TRI: Mahamudra with Lama Glenn Mullin',
  'A six-week online teaching and practice series on Mahamudra, the direct pointing at the nature of mind. Saturdays, August 1 - September 5, 2026.',
  true,
  NULL,
  'ltr',
  '2026-08-01'
)
ON CONFLICT (slug) DO NOTHING;

-- Already applied against the live project on 2026-08-09 via the Management API;
-- the guard below keeps a re-run from duplicating the blocks and recordings
-- (neither table has a natural unique key for ON CONFLICT to hang off).
DO $$
DECLARE _course_id UUID;
BEGIN
  SELECT id INTO _course_id FROM public.courses WHERE slug = 'uma-zub-tri';

  IF EXISTS (SELECT 1 FROM public.course_content_blocks WHERE course_id = _course_id)
     OR EXISTS (SELECT 1 FROM public.course_recordings WHERE course_id = _course_id) THEN
    RAISE NOTICE 'uma-zub-tri content already seeded; skipping.';
    RETURN;
  END IF;

  -- About
  INSERT INTO public.course_content_blocks (course_id, section, title, body, dir, sort_order, is_visible)
  VALUES (
    _course_id,
    'about',
    'About This Series',
    'The Tibetan term "Uma" means "the center". The Buddha used it to describe the search for a perfect balance within us: between relative and ultimate reality, between illusion and the infinite, between the nature of the self and what lies beyond it. The second part of the name, "Zub Tri", means direct pointing - literally, pointing with the finger.

Over six weeks this practice series goes deep into the power of listening, contemplation and meditation - uncovering the radiance of emptiness and the joy of being, and awakening in each of us a direct experience of the Buddha''s words: "Form is emptiness, and emptiness is form." The teachings draw on a range of Tibetan lineage sources, with particular emphasis on the instructions of the early Dalai Lamas.

The series suits both new and experienced practitioners, and is accompanied throughout by Hebrew translation.

Each session is recorded and added to this page after it takes place.',
    'ltr',
    0,
    true
  );

  -- Schedule
  INSERT INTO public.course_content_blocks (course_id, section, title, body, dir, sort_order, is_visible)
  VALUES (
    _course_id,
    'schedule',
    'Schedule',
    'All sessions take place on Zoom, on Saturdays at 16:00 Israel time. Each session runs about an hour to an hour and a half.

Session 1 - Saturday, August 1, 2026
Session 2 - Saturday, August 8, 2026
Session 3 - Saturday, August 15, 2026
Session 4 - Saturday, August 22, 2026
Session 5 - Saturday, August 29, 2026
Session 6 - Saturday, September 5, 2026

Session time by zone
Israel 16:00  |  New York 09:00  |  Brazil and Argentina 10:00  |  Korea 22:00',
    'ltr',
    0,
    true
  );

  -- Recordings (Bunny library 718352)
  INSERT INTO public.course_recordings (course_id, week_number, session_type, title, embed_type, embed_url, sort_order)
  VALUES
    (
      _course_id, 1, NULL,
      'Session 1 - Saturday, August 1, 2026',
      'bunny',
      'https://iframe.mediadelivery.net/embed/718352/e2938671-e12a-472e-97e0-afc86fc2e38b?autoplay=false&loop=false&muted=false&preload=true&responsive=true',
      0
    ),
    (
      _course_id, 2, NULL,
      'Session 2 - Saturday, August 8, 2026',
      'bunny',
      'https://iframe.mediadelivery.net/embed/718352/fa3f5dee-cb0d-44c7-adea-407b0cb9cd9e?autoplay=false&loop=false&muted=false&preload=true&responsive=true',
      1
    );
END $$;
