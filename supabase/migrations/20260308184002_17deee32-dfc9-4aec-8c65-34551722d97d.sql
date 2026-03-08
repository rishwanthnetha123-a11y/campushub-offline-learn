-- Allow HOD to update profiles (class_id, department_id) for students in their department
CREATE POLICY "HOD can update student profiles in department"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  hod_has_department(auth.uid(), department_id)
)
WITH CHECK (
  hod_has_department(auth.uid(), department_id)
);

-- Allow HOD to view students without a department (to assign them)
CREATE POLICY "HOD can update unassigned profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  department_id IS NULL AND has_role(auth.uid(), 'hod'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'hod'::app_role)
);