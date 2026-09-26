-- Registrar: a narrow staff role for registering people who paid directly (PayPal / cash).
-- It opens ONLY /admin/registrations on the site; it is deliberately NOT part of
-- has_any_admin_role() / has_admin_or_above(), so it grants no access to courses, users,
-- site content or anything else. The Manual_Register n8n flow checks for it on every call.
-- ALTER TYPE ... ADD VALUE cannot run inside a transaction - keep this file on its own.

ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'registrar';
