
-- Add subject_id and department_id to videos table
ALTER TABLE public.videos
  ADD COLUMN IF NOT EXISTS subject_id uuid REFERENCES public.subjects(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL;

-- RLS: HOD can manage videos in own department
CREATE POLICY "HOD can manage videos in own department"
  ON public.videos FOR ALL
  TO authenticated
  USING (hod_has_department(auth.uid(), department_id))
  WITH CHECK (hod_has_department(auth.uid(), department_id));

-- RLS: Faculty can manage videos for their assigned subjects
CREATE POLICY "Faculty can manage videos for assigned subjects"
  ON public.videos FOR ALL
  TO authenticated
  USING (
    has_role(auth.uid(), 'faculty') AND
    EXISTS (
      SELECT 1 FROM public.faculty_subjects fs
      WHERE fs.faculty_id = auth.uid()
        AND fs.subject_id = videos.subject_id
    )
  )
  WITH CHECK (
    has_role(auth.uid(), 'faculty') AND
    EXISTS (
      SELECT 1 FROM public.faculty_subjects fs
      WHERE fs.faculty_id = auth.uid()
        AND fs.subject_id = videos.subject_id
    )
  );
