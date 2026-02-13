
-- Deny all INSERT and DELETE on user_roles (only manageable via service role / direct DB)
CREATE POLICY "No public insert on user_roles"
ON public.user_roles FOR INSERT
WITH CHECK (false);

CREATE POLICY "No public delete on user_roles"
ON public.user_roles FOR DELETE
USING (false);
