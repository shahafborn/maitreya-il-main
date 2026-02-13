
-- site_content: recreate SELECT and UPDATE as PERMISSIVE
DROP POLICY "Anyone can read site content" ON public.site_content;
CREATE POLICY "Anyone can read site content" ON public.site_content FOR SELECT USING (true);

DROP POLICY "Admins can update site content" ON public.site_content;
CREATE POLICY "Admins can update site content" ON public.site_content FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

-- transcripts: recreate SELECT and UPDATE as PERMISSIVE
DROP POLICY "Anyone can read transcripts" ON public.transcripts;
CREATE POLICY "Anyone can read transcripts" ON public.transcripts FOR SELECT USING (true);

DROP POLICY "Admins can update transcripts" ON public.transcripts;
CREATE POLICY "Admins can update transcripts" ON public.transcripts FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

-- user_roles: recreate SELECT as PERMISSIVE
DROP POLICY "Users can read own roles" ON public.user_roles;
CREATE POLICY "Users can read own roles" ON public.user_roles FOR SELECT USING (user_id = auth.uid());
