
-- Create notices/announcements table
CREATE TABLE public.notices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  type text NOT NULL DEFAULT 'notice',
  priority text NOT NULL DEFAULT 'normal',
  image_url text,
  is_active boolean NOT NULL DEFAULT true,
  starts_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;

-- Admins can manage all notices
CREATE POLICY "Admins can manage notices"
  ON public.notices FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Everyone can view active notices
CREATE POLICY "Anyone can view active notices"
  ON public.notices FOR SELECT
  TO authenticated
  USING (is_active = true AND starts_at <= now() AND (expires_at IS NULL OR expires_at > now()));

-- Create storage bucket for notice images
INSERT INTO storage.buckets (id, name, public) VALUES ('notice-images', 'notice-images', true);

-- Storage RLS: admins can upload
CREATE POLICY "Admins can upload notice images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'notice-images' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view notice images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'notice-images');

CREATE POLICY "Admins can delete notice images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'notice-images' AND has_role(auth.uid(), 'admin'));
