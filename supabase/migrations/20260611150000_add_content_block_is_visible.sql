-- Per-block visibility toggle for course content sections.
-- Defaults to true (visible); admins turn it off to hide an individual
-- content block on the course page without deleting it.
ALTER TABLE public.course_content_blocks
  ADD COLUMN is_visible BOOLEAN NOT NULL DEFAULT true;
