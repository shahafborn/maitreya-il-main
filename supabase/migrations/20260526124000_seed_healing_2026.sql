-- Seed for "The Path of Tantric Healing" online retreat course page.
-- Six-day Zoom retreat with Lama Glenn Mullin and Drupon Chongwol-la,
-- June 1-6, 2026. Mirrors the mahamudra-2026 seed pattern:
--   * Open enrollment (access_code = NULL) so the current auto-enroll
--     UI works without code entry. The URL is sent privately to paid
--     registrants and serves as the gate.
--   * 'about' + 'schedule' content blocks. No course_meetings rows -
--     the schema is built for weekly recurring sessions, not one-shot
--     retreats; schedule lives as a free-form block.

INSERT INTO public.courses (
  slug, title, description, is_published, access_code, default_dir, course_start_date
)
VALUES (
  'healing-2026',
  'The Path of Tantric Healing',
  'A 6-day online retreat with Lama Glenn Mullin and Drupon Chongwol-la, including initiations of White Tara, Medicine Buddha, and White Chakrasamvara.',
  true,
  NULL,
  'ltr',
  '2026-06-01'
)
ON CONFLICT (slug) DO NOTHING;

DO $$
DECLARE _course_id UUID;
BEGIN
  SELECT id INTO _course_id FROM public.courses WHERE slug = 'healing-2026';

  INSERT INTO public.course_content_blocks (course_id, section, title, body, dir, sort_order)
  VALUES (
    _course_id,
    'about',
    'About This Retreat',
'Six days of deep healing and longevity practices from Tibetan Buddhist Tantra with Lama Glenn Mullin and Drupon Chongwol-la. The retreat includes three initiations - White Tara (Days 1-2), Medicine Buddha (Days 3-4), and White Chakrasamvara (Days 5-6) - paired with teaching, guided practice, yoga, and meditation.

Recordings of all sessions and supporting materials will be uploaded here during and after the retreat, and will remain available for up to one month after the retreat concludes.',
    'ltr',
    0
  )
  ON CONFLICT DO NOTHING;

  INSERT INTO public.course_content_blocks (course_id, section, title, body, dir, sort_order)
  VALUES (
    _course_id,
    'schedule',
    'Schedule',
'All sessions take place on Zoom. All times are Israel time (IDT).

Day 1 - Monday, June 1, 2026 (White Tara)
14:00 - Retreat opening, teaching, and initiation

Day 2 - Tuesday, June 2, 2026 (White Tara)
09:30 - Four sessions through the day with breaks in between

Day 3 - Wednesday, June 3, 2026 (Medicine Buddha)
09:30 - Four sessions through the day with breaks in between

Day 4 - Thursday, June 4, 2026 (Medicine Buddha)
09:30 - Four sessions through the day with breaks in between

Day 5 - Friday, June 5, 2026 (White Chakrasamvara)
09:30 - Four sessions through the day with breaks in between

Day 6 - Saturday, June 6, 2026 (White Chakrasamvara)
09:30 - Sessions through the morning and early afternoon
15:00 - Closing

Each day includes teaching, initiation, guided practice, yoga, and meditation.

Daily start time by timezone (Days 2-6)
09:30 Israel (IDT)  |  07:30 London (BST)  |  02:30 New York (EDT)  |  16:30 Sydney (AEST)

Zoom
The same Zoom room is used for all six days.
Join Zoom: https://us06web.zoom.us/j/89503700954?pwd=ytGsWX3XopKwVczSUlkf4Lg6qaR1TB.1
Meeting ID: 895 0370 0954
Passcode: 502593',
    'ltr',
    0
  )
  ON CONFLICT DO NOTHING;
END $$;
