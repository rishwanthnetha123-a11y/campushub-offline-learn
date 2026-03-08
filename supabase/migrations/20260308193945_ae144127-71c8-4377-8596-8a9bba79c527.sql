
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS roll_no text,
  ADD COLUMN IF NOT EXISTS phone text;
