-- Seed script for "Introduction to Tantra" course.
-- Run this AFTER the migration has been applied and you have
-- bootstrapped your admin user in user_roles.
--
-- Usage:
--   1. Apply migration: supabase db push (or via Supabase dashboard)
--   2. Bootstrap admin: INSERT INTO user_roles (user_id, role) VALUES ('<your-uid>', 'admin');
--   3. Run this seed: psql -f supabase/seed_intro_to_tantra.sql
--   OR paste into the Supabase SQL editor.

-- Insert the course
INSERT INTO public.courses (slug, title, description, is_published, access_code, default_dir)
VALUES (
  'intro-to-tantra',
  'Introduction to Tantra',
  'An 8-week introductory course to Tantric Buddhist practice with Lama Glenn Mullin.',
  true,
  'tantra2026',  -- Change this to your actual access code
  'ltr'
)
ON CONFLICT (slug) DO NOTHING;

-- Insert recurring meetings (Saturday main + Monday clarification)
-- Using Israel time (Asia/Jerusalem)
DO $$
DECLARE _course_id UUID;
BEGIN
  SELECT id INTO _course_id FROM public.courses WHERE slug = 'intro-to-tantra';

  INSERT INTO public.course_meetings (course_id, weekday, label, start_time_local, duration_minutes, timezone, sort_order)
  VALUES
    (_course_id, 'sat', 'Main Teaching', '18:00', 120, 'Asia/Jerusalem', 0),
    (_course_id, 'mon', 'Clarification Session', '19:00', 60, 'Asia/Jerusalem', 1)
  ON CONFLICT DO NOTHING;

  -- Insert a sample "about" content block
  INSERT INTO public.course_content_blocks (course_id, section, title, body, dir, sort_order)
  VALUES (
    _course_id,
    'about',
    'About This Course',
    'This 8-week course introduces the foundations of Tantric Buddhist practice. Each week includes a main teaching session on Saturday and a clarification session on Monday where you can ask questions and deepen your understanding.',
    'ltr',
    0
  )
  ON CONFLICT DO NOTHING;
END $$;
