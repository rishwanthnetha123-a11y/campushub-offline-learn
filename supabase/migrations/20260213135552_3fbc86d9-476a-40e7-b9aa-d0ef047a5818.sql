
-- Create storage bucket for resources (PDFs, notes, audio)
INSERT INTO storage.buckets (id, name, public) VALUES ('resources', 'resources', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to resources bucket
CREATE POLICY "Admins can upload resources"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'resources' AND public.has_role(auth.uid(), 'admin'));

-- Anyone can view resources
CREATE POLICY "Anyone can view resources"
ON storage.objects FOR SELECT
USING (bucket_id = 'resources');

-- Admins can delete resources
CREATE POLICY "Admins can delete resources"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'resources' AND public.has_role(auth.uid(), 'admin'));
