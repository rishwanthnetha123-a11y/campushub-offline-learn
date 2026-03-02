
-- =============================================
-- 1. Departments table
-- =============================================
CREATE TABLE IF NOT EXISTS public.departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage departments"
  ON public.departments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can view departments"
  ON public.departments FOR SELECT TO authenticated
  USING (true);

-- =============================================
-- 2. Classes table
-- =============================================
CREATE TABLE IF NOT EXISTS public.classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id uuid NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  year integer NOT NULL,
  section text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(department_id, year, section)
);
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage classes"
  ON public.classes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can view classes"
  ON public.classes FOR SELECT TO authenticated
  USING (true);

-- =============================================
-- 3. Add department_id and class_id to profiles
-- =============================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS class_id uuid REFERENCES public.classes(id) ON DELETE SET NULL;

-- =============================================
-- 4. Faculty-classes mapping (BEFORE the function)
-- =============================================
CREATE TABLE IF NOT EXISTS public.faculty_classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  faculty_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(faculty_id, class_id)
);
ALTER TABLE public.faculty_classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage faculty_classes"
  ON public.faculty_classes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Faculty can view own assignments"
  ON public.faculty_classes FOR SELECT TO authenticated
  USING (faculty_id = auth.uid());

-- =============================================
-- 5. Helper function (NOW safe, table exists)
-- =============================================
CREATE OR REPLACE FUNCTION public.faculty_has_class(_user_id uuid, _class_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.faculty_classes
    WHERE faculty_id = _user_id AND class_id = _class_id
  )
$$;

-- =============================================
-- 6. Attendance table
-- =============================================
CREATE TABLE IF NOT EXISTS public.attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'absent' CHECK (status IN ('present', 'absent', 'late')),
  marked_by uuid NOT NULL REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(student_id, class_id, date)
);
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_attendance_updated_at
  BEFORE UPDATE ON public.attendance
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Admins can manage attendance"
  ON public.attendance FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Faculty can view attendance for assigned classes"
  ON public.attendance FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'faculty')
    AND public.faculty_has_class(auth.uid(), class_id)
  );

CREATE POLICY "Faculty can insert attendance for assigned classes"
  ON public.attendance FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'faculty')
    AND public.faculty_has_class(auth.uid(), class_id)
    AND marked_by = auth.uid()
  );

CREATE POLICY "Faculty can update attendance for assigned classes"
  ON public.attendance FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'faculty')
    AND public.faculty_has_class(auth.uid(), class_id)
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'faculty')
    AND public.faculty_has_class(auth.uid(), class_id)
    AND marked_by = auth.uid()
  );

CREATE POLICY "Students can view own attendance"
  ON public.attendance FOR SELECT TO authenticated
  USING (student_id = auth.uid());

-- =============================================
-- 7. Marks table
-- =============================================
CREATE TABLE IF NOT EXISTS public.marks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  subject text NOT NULL,
  exam_type text NOT NULL DEFAULT 'internal',
  marks_obtained numeric NOT NULL DEFAULT 0,
  max_marks numeric NOT NULL DEFAULT 100,
  entered_by uuid NOT NULL REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.marks ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_marks_updated_at
  BEFORE UPDATE ON public.marks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Admins can manage marks"
  ON public.marks FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Faculty can view marks for assigned classes"
  ON public.marks FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'faculty')
    AND public.faculty_has_class(auth.uid(), class_id)
  );

CREATE POLICY "Faculty can insert marks for assigned classes"
  ON public.marks FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'faculty')
    AND public.faculty_has_class(auth.uid(), class_id)
    AND entered_by = auth.uid()
  );

CREATE POLICY "Faculty can update marks for assigned classes"
  ON public.marks FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'faculty')
    AND public.faculty_has_class(auth.uid(), class_id)
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'faculty')
    AND public.faculty_has_class(auth.uid(), class_id)
    AND entered_by = auth.uid()
  );

CREATE POLICY "Students can view own marks"
  ON public.marks FOR SELECT TO authenticated
  USING (student_id = auth.uid());
