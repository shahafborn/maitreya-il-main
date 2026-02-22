-- Course Resource Page System
-- Creates tables, RLS policies, enrollment RPC, and storage bucket
-- for a reusable /p/courses/:slug resource page system.

-- =============================================================
-- 1. TABLES
-- =============================================================

-- Courses (public preview for published courses)
CREATE TABLE public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  hero_image_url TEXT,
  course_start_date DATE,
  is_published BOOLEAN NOT NULL DEFAULT false,
  access_code TEXT,  -- NULL = free/open enrollment; non-NULL = requires code
  default_dir TEXT NOT NULL DEFAULT 'ltr' CHECK (default_dir IN ('ltr', 'rtl')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Course enrollments (per-user, per-course)
CREATE TABLE public.course_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, course_id)
);

-- Recurring meeting schedule (typically 2 rows per course: Saturday + Monday)
CREATE TABLE public.course_meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  weekday TEXT NOT NULL CHECK (weekday IN ('sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat')),
  label TEXT NOT NULL,                         -- e.g. "Main teaching", "Clarification"
  start_time_local TIME NOT NULL,              -- canonical local time
  duration_minutes INT NOT NULL DEFAULT 90,
  timezone TEXT NOT NULL DEFAULT 'Asia/Jerusalem',
  zoom_join_url TEXT,
  zoom_meeting_id TEXT,
  zoom_passcode TEXT,
  note TEXT,                                   -- free-text note displayed under times
  sort_order INT NOT NULL DEFAULT 0
);

-- Text content blocks (about, practice, footer, etc.)
CREATE TABLE public.course_content_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  section TEXT NOT NULL,                        -- e.g. 'about', 'practice', 'footer_note'
  title TEXT,
  body TEXT NOT NULL DEFAULT '',
  dir TEXT NOT NULL DEFAULT 'ltr' CHECK (dir IN ('ltr', 'rtl')),
  sort_order INT NOT NULL DEFAULT 0
);

-- Uploaded resources (photos + PDFs)
CREATE TABLE public.course_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('photo', 'pdf')),
  title TEXT NOT NULL DEFAULT '',
  description TEXT,
  storage_path TEXT NOT NULL,                  -- e.g. '{course_id}/photos/img.jpg'
  mime_type TEXT,
  file_size INT,
  sort_order INT NOT NULL DEFAULT 0
);

-- Video recordings
CREATE TABLE public.course_recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  week_number INT,
  session_type TEXT CHECK (session_type IN ('main', 'clarification')),
  title TEXT NOT NULL,
  embed_type TEXT NOT NULL CHECK (embed_type IN ('bunny', 'youtube', 'iframe')),
  embed_url TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0
);

-- =============================================================
-- 2. INDEXES
-- =============================================================

CREATE INDEX idx_course_enrollments_user ON public.course_enrollments (user_id);
CREATE INDEX idx_course_enrollments_course ON public.course_enrollments (course_id);
CREATE INDEX idx_course_meetings_course ON public.course_meetings (course_id);
CREATE INDEX idx_course_content_blocks_course ON public.course_content_blocks (course_id, sort_order);
CREATE INDEX idx_course_resources_course ON public.course_resources (course_id, sort_order);
CREATE INDEX idx_course_recordings_course ON public.course_recordings (course_id, sort_order);

-- =============================================================
-- 3. HELPER FUNCTIONS
-- =============================================================

-- Check if the current user is enrolled in a given course.
-- SECURITY DEFINER so it can be called from RLS policies without
-- requiring the caller to have SELECT on course_enrollments.
CREATE OR REPLACE FUNCTION public.is_enrolled(_course_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.course_enrollments
    WHERE user_id = auth.uid() AND course_id = _course_id
  )
$$;

-- Auto-update updated_at on courses table
CREATE OR REPLACE FUNCTION public.update_courses_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_courses_timestamp
BEFORE UPDATE ON public.courses
FOR EACH ROW
EXECUTE FUNCTION public.update_courses_updated_at();

-- =============================================================
-- 4. ENROLLMENT RPC
-- =============================================================

-- Validates course is published + access code (if required),
-- then inserts an enrollment row. Returns the new enrollment id.
CREATE OR REPLACE FUNCTION public.enroll_in_course(
  _course_id UUID,
  _access_code TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _course RECORD;
  _enrollment_id UUID;
BEGIN
  -- Must be authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Fetch course (must exist and be published)
  SELECT id, access_code, is_published
    INTO _course
    FROM public.courses
    WHERE id = _course_id;

  IF _course IS NULL THEN
    RAISE EXCEPTION 'Course not found';
  END IF;

  IF NOT _course.is_published THEN
    RAISE EXCEPTION 'Course is not available';
  END IF;

  -- Validate access code if course requires one
  IF _course.access_code IS NOT NULL THEN
    IF _access_code IS NULL OR _access_code <> _course.access_code THEN
      RAISE EXCEPTION 'Invalid access code';
    END IF;
  END IF;

  -- Insert enrollment (ON CONFLICT = idempotent)
  INSERT INTO public.course_enrollments (user_id, course_id)
  VALUES (auth.uid(), _course_id)
  ON CONFLICT (user_id, course_id) DO NOTHING
  RETURNING id INTO _enrollment_id;

  -- If already enrolled, fetch existing id
  IF _enrollment_id IS NULL THEN
    SELECT id INTO _enrollment_id
      FROM public.course_enrollments
      WHERE user_id = auth.uid() AND course_id = _course_id;
  END IF;

  RETURN _enrollment_id;
END;
$$;

-- =============================================================
-- 5. ROW LEVEL SECURITY
-- =============================================================

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_content_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_recordings ENABLE ROW LEVEL SECURITY;

-- ---- courses ----
-- Public: anyone can see published courses (hero/preview)
CREATE POLICY "Published courses are visible to everyone"
ON public.courses FOR SELECT
USING (is_published = true);

-- Admin: full CRUD
CREATE POLICY "Admins can manage courses"
ON public.courses FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ---- course_enrollments ----
-- Users can read their own enrollments
CREATE POLICY "Users can read own enrollments"
ON public.course_enrollments FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Admins can read all enrollments
CREATE POLICY "Admins can manage enrollments"
ON public.course_enrollments FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Note: self-enrollment is handled exclusively through the
-- enroll_in_course() RPC (SECURITY DEFINER), so no INSERT
-- policy is needed for regular users.

-- ---- Gated content tables (meetings, blocks, resources, recordings) ----
-- Pattern: enrolled users OR admins can SELECT

CREATE POLICY "Enrolled users can read meetings"
ON public.course_meetings FOR SELECT
TO authenticated
USING (
  public.is_enrolled(course_id)
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can manage meetings"
ON public.course_meetings FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Enrolled users can read content blocks"
ON public.course_content_blocks FOR SELECT
TO authenticated
USING (
  public.is_enrolled(course_id)
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can manage content blocks"
ON public.course_content_blocks FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Enrolled users can read resources"
ON public.course_resources FOR SELECT
TO authenticated
USING (
  public.is_enrolled(course_id)
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can manage resources"
ON public.course_resources FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Enrolled users can read recordings"
ON public.course_recordings FOR SELECT
TO authenticated
USING (
  public.is_enrolled(course_id)
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can manage recordings"
ON public.course_recordings FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =============================================================
-- 6. STORAGE BUCKET (private)
-- =============================================================

-- Create private bucket for course assets (photos + PDFs).
-- Path convention: {course_id}/photos/* and {course_id}/files/*
INSERT INTO storage.buckets (id, name, public)
VALUES ('course-assets', 'course-assets', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: enrolled users or admins can read objects
-- The course_id is extracted from the first path segment.
CREATE POLICY "Enrolled users can read course assets"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'course-assets'
  AND (
    public.is_enrolled((storage.foldername(name))[1]::UUID)
    OR public.has_role(auth.uid(), 'admin')
  )
);

-- Storage RLS: only admins can upload/update/delete
CREATE POLICY "Admins can upload course assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'course-assets'
  AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can update course assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'course-assets'
  AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can delete course assets"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'course-assets'
  AND public.has_role(auth.uid(), 'admin')
);
