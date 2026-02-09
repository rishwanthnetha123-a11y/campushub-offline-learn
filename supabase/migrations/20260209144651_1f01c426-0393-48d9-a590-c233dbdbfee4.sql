
-- Drop the restrictive policies and recreate as permissive
DROP POLICY IF EXISTS "Anyone can view active videos" ON public.videos;
DROP POLICY IF EXISTS "Admins can manage videos" ON public.videos;

-- Recreate as PERMISSIVE policies
CREATE POLICY "Anyone can view active videos"
ON public.videos
FOR SELECT
TO public
USING (is_active = true);

CREATE POLICY "Admins can manage videos"
ON public.videos
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));
