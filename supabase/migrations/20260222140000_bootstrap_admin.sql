-- Bootstrap admin role for the first registered user (project owner).
-- This is a one-time operation. The user_roles table already exists
-- from the initial migration.
--
-- If no admin row exists yet, insert one for the earliest profile.
INSERT INTO public.user_roles (user_id, role)
SELECT p.id, 'admin'::app_role
FROM public.profiles p
ORDER BY p.created_at ASC
LIMIT 1
ON CONFLICT (user_id, role) DO NOTHING;
