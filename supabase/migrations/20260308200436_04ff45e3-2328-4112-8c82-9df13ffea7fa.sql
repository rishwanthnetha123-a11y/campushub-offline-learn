
-- Allow HOD to manage faculty_classes in their own department
CREATE POLICY "HOD can manage faculty_classes in own department"
ON public.faculty_classes
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM classes c
    WHERE c.id = faculty_classes.class_id
    AND hod_has_department(auth.uid(), c.department_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM classes c
    WHERE c.id = faculty_classes.class_id
    AND hod_has_department(auth.uid(), c.department_id)
  )
);
