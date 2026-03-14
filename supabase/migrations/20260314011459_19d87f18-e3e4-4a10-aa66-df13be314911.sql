
-- Fix overly permissive insert policy
DROP POLICY "System can insert notifications" ON public.notifications;

-- Only faculty, hod, and admin can create notifications
CREATE POLICY "Staff can insert notifications" ON public.notifications
FOR INSERT TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'faculty'::app_role)
  OR has_role(auth.uid(), 'hod'::app_role)
  OR has_role(auth.uid(), 'admin'::app_role)
);
