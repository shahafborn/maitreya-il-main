-- Seed for the "Mahamudra: Heart of Wisdom" 3-day retreat course page.
-- Mirrors the structure of seed_intro_to_tantra (20260222130000) but adapted
-- for a one-shot retreat instead of an 8-week recurring course:
--   * No course_meetings rows (the retreat is not weekly-recurring).
--   * Recordings, photos, and PDFs will be added later via the admin UI.

-- Insert the course
INSERT INTO public.courses (
  slug,
  title,
  description,
  is_published,
  access_code,
  default_dir,
  course_start_date
)
VALUES (
  'mahamudra-2026',
  'Mahamudra: Heart of Wisdom',
  'A 3-day retreat with Lama Glenn Mullin exploring the wisdom methods of Buddhist Tantra through the 7th Dalai Lama''s "Entering Emptiness from All Four Directions," including the White Manjushri empowerment.',
  true,
  'Mahamudra26',
  'ltr',
  '2026-05-28'
)
ON CONFLICT (slug) DO NOTHING;

-- Insert the "about" content block
DO $$
DECLARE _course_id UUID;
BEGIN
  SELECT id INTO _course_id FROM public.courses WHERE slug = 'mahamudra-2026';

  INSERT INTO public.course_content_blocks (course_id, section, title, body, dir, sort_order)
  VALUES (
    _course_id,
    'about',
    'About This Retreat',
    'Over three days, Lama Glenn Mullin guides us through deep study of an 18th-century song of realization by the 7th Dalai Lama, "Entering Emptiness from All Four Directions" - paired with practical meditation instruction and guided practice. The retreat also includes an empowerment of White Manjushri, the supreme Buddha of Wisdom, opening the gateway to the practice and granting a direct connection to the lineage.

Recordings of all sessions and supporting materials will be uploaded here during and after the retreat, and will remain available for up to one month after the retreat concludes.',
    'ltr',
    0
  )
  ON CONFLICT DO NOTHING;
END $$;
