-- Grant admin role to shahafb@gmail.com
INSERT INTO public.user_roles (user_id, role)
SELECT p.id, 'admin'::app_role
FROM public.profiles p
WHERE p.email = 'shahafb@gmail.com'
LIMIT 1
ON CONFLICT (user_id, role) DO NOTHING;
