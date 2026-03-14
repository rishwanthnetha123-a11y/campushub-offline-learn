
CREATE POLICY "HOD can read hod and admin roles" ON public.user_roles
FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'hod'::app_role)
  AND role IN ('hod'::app_role, 'admin'::app_role)
);
