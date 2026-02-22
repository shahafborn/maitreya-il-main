-- Admin Roles & Analytics System
-- Requires: 20260223000000_add_role_enum_values.sql (adds super_admin, editor to app_role)

-- =============================================================
-- 1. HELPER FUNCTION: has_any_admin_role
-- =============================================================

-- Returns true if the user has super_admin, admin, or editor role.
CREATE OR REPLACE FUNCTION public.has_any_admin_role(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('super_admin', 'admin', 'editor')
  )
$$;

-- Returns true if the user has super_admin or admin role (not editor).
CREATE OR REPLACE FUNCTION public.has_admin_or_above(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('super_admin', 'admin')
  )
$$;

-- =============================================================
-- 2. DROP + RECREATE ALL RLS POLICIES (course system)
-- =============================================================

-- ---- courses ----
DROP POLICY IF EXISTS "Admins can manage courses" ON public.courses;
CREATE POLICY "Admins can manage courses"
ON public.courses FOR ALL
TO authenticated
USING (public.has_any_admin_role(auth.uid()))
WITH CHECK (public.has_any_admin_role(auth.uid()));

-- ---- course_enrollments ----
DROP POLICY IF EXISTS "Admins can manage enrollments" ON public.course_enrollments;
CREATE POLICY "Admins can manage enrollments"
ON public.course_enrollments FOR ALL
TO authenticated
USING (public.has_any_admin_role(auth.uid()))
WITH CHECK (public.has_any_admin_role(auth.uid()));

-- ---- course_meetings ----
DROP POLICY IF EXISTS "Enrolled users can read meetings" ON public.course_meetings;
CREATE POLICY "Enrolled users can read meetings"
ON public.course_meetings FOR SELECT
TO authenticated
USING (
  public.is_enrolled(course_id)
  OR public.has_any_admin_role(auth.uid())
);

DROP POLICY IF EXISTS "Admins can manage meetings" ON public.course_meetings;
CREATE POLICY "Admins can manage meetings"
ON public.course_meetings FOR ALL
TO authenticated
USING (public.has_any_admin_role(auth.uid()))
WITH CHECK (public.has_any_admin_role(auth.uid()));

-- ---- course_content_blocks ----
DROP POLICY IF EXISTS "Enrolled users can read content blocks" ON public.course_content_blocks;
CREATE POLICY "Enrolled users can read content blocks"
ON public.course_content_blocks FOR SELECT
TO authenticated
USING (
  public.is_enrolled(course_id)
  OR public.has_any_admin_role(auth.uid())
);

DROP POLICY IF EXISTS "Admins can manage content blocks" ON public.course_content_blocks;
CREATE POLICY "Admins can manage content blocks"
ON public.course_content_blocks FOR ALL
TO authenticated
USING (public.has_any_admin_role(auth.uid()))
WITH CHECK (public.has_any_admin_role(auth.uid()));

-- ---- course_resources ----
DROP POLICY IF EXISTS "Enrolled users can read resources" ON public.course_resources;
CREATE POLICY "Enrolled users can read resources"
ON public.course_resources FOR SELECT
TO authenticated
USING (
  public.is_enrolled(course_id)
  OR public.has_any_admin_role(auth.uid())
);

DROP POLICY IF EXISTS "Admins can manage resources" ON public.course_resources;
CREATE POLICY "Admins can manage resources"
ON public.course_resources FOR ALL
TO authenticated
USING (public.has_any_admin_role(auth.uid()))
WITH CHECK (public.has_any_admin_role(auth.uid()));

-- ---- course_recordings ----
DROP POLICY IF EXISTS "Enrolled users can read recordings" ON public.course_recordings;
CREATE POLICY "Enrolled users can read recordings"
ON public.course_recordings FOR SELECT
TO authenticated
USING (
  public.is_enrolled(course_id)
  OR public.has_any_admin_role(auth.uid())
);

DROP POLICY IF EXISTS "Admins can manage recordings" ON public.course_recordings;
CREATE POLICY "Admins can manage recordings"
ON public.course_recordings FOR ALL
TO authenticated
USING (public.has_any_admin_role(auth.uid()))
WITH CHECK (public.has_any_admin_role(auth.uid()));

-- ---- storage policies ----
DROP POLICY IF EXISTS "Enrolled users can read course assets" ON storage.objects;
CREATE POLICY "Enrolled users can read course assets"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'course-assets'
  AND (
    public.is_enrolled((storage.foldername(name))[1]::UUID)
    OR public.has_any_admin_role(auth.uid())
  )
);

DROP POLICY IF EXISTS "Admins can upload course assets" ON storage.objects;
CREATE POLICY "Admins can upload course assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'course-assets'
  AND public.has_any_admin_role(auth.uid())
);

DROP POLICY IF EXISTS "Admins can update course assets" ON storage.objects;
CREATE POLICY "Admins can update course assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'course-assets'
  AND public.has_any_admin_role(auth.uid())
);

DROP POLICY IF EXISTS "Admins can delete course assets" ON storage.objects;
CREATE POLICY "Admins can delete course assets"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'course-assets'
  AND public.has_any_admin_role(auth.uid())
);

-- ---- transcripts (from initial migration) ----
DROP POLICY IF EXISTS "Admins can update transcripts" ON public.transcripts;
CREATE POLICY "Admins can update transcripts"
ON public.transcripts FOR UPDATE
TO authenticated
USING (public.has_any_admin_role(auth.uid()));

-- =============================================================
-- 3. PROFILES RLS: admins can read all profiles
-- =============================================================

CREATE POLICY "Admins can read all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (public.has_admin_or_above(auth.uid()));

-- =============================================================
-- 4. USER_ROLES RLS: super_admin management + admin read
-- =============================================================

-- Admins + super_admins can read all roles
CREATE POLICY "Admins can read all roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (public.has_admin_or_above(auth.uid()));

-- Super admins can insert roles
CREATE POLICY "Super admins can insert roles"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Super admins can delete roles
CREATE POLICY "Super admins can delete roles"
ON public.user_roles FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

-- Prevent deleting the last super_admin role
CREATE OR REPLACE FUNCTION public.prevent_last_super_admin_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF OLD.role = 'super_admin' THEN
    IF (SELECT count(*) FROM public.user_roles WHERE role = 'super_admin') <= 1 THEN
      RAISE EXCEPTION 'Cannot revoke the last super_admin role';
    END IF;
  END IF;
  RETURN OLD;
END;
$$;

CREATE TRIGGER guard_last_super_admin
BEFORE DELETE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_last_super_admin_delete();

-- =============================================================
-- 5. ANALYTICS TABLES
-- =============================================================

-- Daily recording views (one row per user/recording/day)
CREATE TABLE public.daily_recording_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recording_id UUID NOT NULL REFERENCES public.course_recordings(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  view_count INT NOT NULL DEFAULT 1,
  last_viewed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, recording_id, date)
);

CREATE INDEX idx_daily_recording_views_course ON public.daily_recording_views (course_id, date);
CREATE INDEX idx_daily_recording_views_recording ON public.daily_recording_views (recording_id, date);

ALTER TABLE public.daily_recording_views ENABLE ROW LEVEL SECURITY;

-- Users can insert their own views
CREATE POLICY "Users can insert own recording views"
ON public.daily_recording_views FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Users can update their own views (for upsert increment)
CREATE POLICY "Users can update own recording views"
ON public.daily_recording_views FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- Admins can read all views (for analytics)
CREATE POLICY "Admins can read all recording views"
ON public.daily_recording_views FOR SELECT
TO authenticated
USING (public.has_admin_or_above(auth.uid()));

-- Daily resource downloads (one row per user/resource/day)
CREATE TABLE public.daily_resource_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resource_id UUID NOT NULL REFERENCES public.course_resources(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  download_count INT NOT NULL DEFAULT 1,
  last_downloaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, resource_id, date)
);

CREATE INDEX idx_daily_resource_downloads_course ON public.daily_resource_downloads (course_id, date);
CREATE INDEX idx_daily_resource_downloads_resource ON public.daily_resource_downloads (resource_id, date);

ALTER TABLE public.daily_resource_downloads ENABLE ROW LEVEL SECURITY;

-- Users can insert their own downloads
CREATE POLICY "Users can insert own resource downloads"
ON public.daily_resource_downloads FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Users can update their own downloads (for upsert increment)
CREATE POLICY "Users can update own resource downloads"
ON public.daily_resource_downloads FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- Admins can read all downloads (for analytics)
CREATE POLICY "Admins can read all resource downloads"
ON public.daily_resource_downloads FOR SELECT
TO authenticated
USING (public.has_admin_or_above(auth.uid()));

-- =============================================================
-- 6. ANALYTICS TRACKING RPCs (upsert with increment)
-- =============================================================

CREATE OR REPLACE FUNCTION public.track_recording_view(
  _recording_id UUID,
  _course_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN; END IF;

  INSERT INTO public.daily_recording_views (user_id, recording_id, course_id, date, view_count, last_viewed_at)
  VALUES (auth.uid(), _recording_id, _course_id, CURRENT_DATE, 1, now())
  ON CONFLICT (user_id, recording_id, date)
  DO UPDATE SET view_count = daily_recording_views.view_count + 1, last_viewed_at = now();
END;
$$;

CREATE OR REPLACE FUNCTION public.track_resource_download(
  _resource_id UUID,
  _course_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN; END IF;

  INSERT INTO public.daily_resource_downloads (user_id, resource_id, course_id, date, download_count, last_downloaded_at)
  VALUES (auth.uid(), _resource_id, _course_id, CURRENT_DATE, 1, now())
  ON CONFLICT (user_id, resource_id, date)
  DO UPDATE SET download_count = daily_resource_downloads.download_count + 1, last_downloaded_at = now();
END;
$$;

-- =============================================================
-- 7. UPDATE_COURSE_METADATA RPC (admin+ only, NOT editors)
-- =============================================================

CREATE OR REPLACE FUNCTION public.update_course_metadata(
  _course_id UUID,
  _title TEXT DEFAULT NULL,
  _slug TEXT DEFAULT NULL,
  _description TEXT DEFAULT NULL,
  _hero_image_url TEXT DEFAULT NULL,
  _course_start_date DATE DEFAULT NULL,
  _access_code TEXT DEFAULT NULL,
  _default_dir TEXT DEFAULT NULL,
  _is_published BOOLEAN DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admin or super_admin can update course metadata (not editor)
  IF NOT public.has_admin_or_above(auth.uid()) THEN
    RAISE EXCEPTION 'Permission denied: admin or super_admin role required';
  END IF;

  UPDATE public.courses SET
    title = COALESCE(_title, title),
    slug = COALESCE(_slug, slug),
    description = COALESCE(_description, description),
    hero_image_url = COALESCE(_hero_image_url, hero_image_url),
    course_start_date = COALESCE(_course_start_date, course_start_date),
    access_code = COALESCE(_access_code, access_code),
    default_dir = COALESCE(_default_dir, default_dir),
    is_published = COALESCE(_is_published, is_published)
  WHERE id = _course_id;
END;
$$;

-- =============================================================
-- 8. GRANT EXISTING ADMINS SUPER_ADMIN ROLE
-- =============================================================

INSERT INTO public.user_roles (user_id, role)
SELECT user_id, 'super_admin'::app_role
FROM public.user_roles
WHERE role = 'admin'
ON CONFLICT (user_id, role) DO NOTHING;
