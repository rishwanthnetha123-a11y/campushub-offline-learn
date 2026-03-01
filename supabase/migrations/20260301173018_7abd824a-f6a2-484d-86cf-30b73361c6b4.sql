-- Idempotent: adds 'faculty' only if not already present
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'faculty';