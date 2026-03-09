
-- Allow Faculty and HOD to upload videos
CREATE POLICY "Faculty can upload videos" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'videos' AND has_role(auth.uid(), 'faculty'::app_role)
);

CREATE POLICY "HOD can upload videos" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'videos' AND has_role(auth.uid(), 'hod'::app_role)
);

-- Allow Faculty and HOD to upload thumbnails
CREATE POLICY "Faculty can upload thumbnails" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'thumbnails' AND has_role(auth.uid(), 'faculty'::app_role)
);

CREATE POLICY "HOD can upload thumbnails" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'thumbnails' AND has_role(auth.uid(), 'hod'::app_role)
);

-- Allow Faculty and HOD to delete their own videos from storage
CREATE POLICY "Faculty can delete own videos" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'videos' AND has_role(auth.uid(), 'faculty'::app_role)
);

CREATE POLICY "HOD can delete videos" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'videos' AND has_role(auth.uid(), 'hod'::app_role)
);

-- Create video_analytics table for engagement tracking
CREATE TABLE public.video_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  watch_time INTEGER NOT NULL DEFAULT 0,
  skip_count INTEGER NOT NULL DEFAULT 0,
  completion_percentage NUMERIC(5,2) NOT NULL DEFAULT 0,
  idle_time INTEGER NOT NULL DEFAULT 0,
  attention_score NUMERIC(5,2) NOT NULL DEFAULT 100,
  engagement_level TEXT NOT NULL DEFAULT 'medium',
  last_position INTEGER NOT NULL DEFAULT 0,
  total_duration INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(student_id, video_id)
);

ALTER TABLE public.video_analytics ENABLE ROW LEVEL SECURITY;

-- Students can manage their own analytics
CREATE POLICY "Students can manage own video analytics" ON public.video_analytics
FOR ALL TO authenticated
USING (auth.uid() = student_id)
WITH CHECK (auth.uid() = student_id);

-- Faculty can view analytics for videos they uploaded
CREATE POLICY "Faculty can view video analytics" ON public.video_analytics
FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'faculty'::app_role) AND
  EXISTS (
    SELECT 1 FROM public.videos v
    WHERE v.id = video_analytics.video_id AND v.uploaded_by = auth.uid()
  )
);

-- HOD can view analytics for videos in their department
CREATE POLICY "HOD can view video analytics" ON public.video_analytics
FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'hod'::app_role) AND
  EXISTS (
    SELECT 1 FROM public.videos v
    WHERE v.id = video_analytics.video_id AND hod_has_department(auth.uid(), v.department_id)
  )
);

-- Admins can view all
CREATE POLICY "Admins can view all video analytics" ON public.video_analytics
FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add updated_at trigger
CREATE TRIGGER update_video_analytics_updated_at
  BEFORE UPDATE ON public.video_analytics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
