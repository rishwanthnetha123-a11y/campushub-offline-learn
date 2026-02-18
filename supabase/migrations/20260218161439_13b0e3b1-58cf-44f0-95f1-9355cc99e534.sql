-- Add language column to videos table
ALTER TABLE public.videos ADD COLUMN language text NOT NULL DEFAULT 'en';

-- Add language column to resources table
ALTER TABLE public.resources ADD COLUMN language text NOT NULL DEFAULT 'en';

-- Create index for language filtering
CREATE INDEX idx_videos_language ON public.videos (language);
CREATE INDEX idx_resources_language ON public.resources (language);