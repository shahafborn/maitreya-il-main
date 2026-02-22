-- Add new role enum values to app_role.
-- NOTE: ALTER TYPE ... ADD VALUE cannot run inside a transaction.
-- This must be a separate migration file.

ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'editor';
