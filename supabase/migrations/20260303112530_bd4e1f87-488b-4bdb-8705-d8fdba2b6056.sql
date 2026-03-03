
-- 1. Create subjects table (if not exists from partial migration)
CREATE TABLE IF NOT EXISTS public.subjects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subject_code TEXT NOT NULL,
  subject_name TEXT NOT NULL,
  semester INTEGER NOT NULL,
  department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(subject_code, department_id)
);
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

-- 2. Create faculty_subjects table
CREATE TABLE IF NOT EXISTS public.faculty_subjects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  faculty_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(faculty_id, class_id, subject_id)
);
ALTER TABLE public.faculty_subjects ENABLE ROW LEVEL SECURITY;

-- 3. Create schedules table
CREATE TABLE IF NOT EXISTS public.schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  faculty_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;

-- 4. Create role_invites table
CREATE TABLE IF NOT EXISTS public.role_invites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  role public.app_role NOT NULL,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  invite_token UUID NOT NULL DEFAULT gen_random_uuid(),
  accepted BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  invited_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(invite_token)
);
ALTER TABLE public.role_invites ENABLE ROW LEVEL SECURITY;

-- 5. Add subject_id to attendance and marks
ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE;
ALTER TABLE public.marks ADD COLUMN IF NOT EXISTS subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE;

-- 6. HOD helper function
CREATE OR REPLACE FUNCTION public.hod_has_department(_user_id UUID, _department_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.user_roles ur ON ur.user_id = p.id
    WHERE p.id = _user_id
      AND ur.role = 'hod'
      AND p.department_id = _department_id
  )
$$;

-- 7. Faculty has subject helper
CREATE OR REPLACE FUNCTION public.faculty_has_subject(_user_id UUID, _subject_id UUID, _class_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.faculty_subjects
    WHERE faculty_id = _user_id AND subject_id = _subject_id AND class_id = _class_id
  )
$$;

-- ==================== RLS POLICIES ====================

-- SUBJECTS
CREATE POLICY "Admins can manage subjects" ON public.subjects FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "HOD can manage subjects in own department" ON public.subjects FOR ALL TO authenticated
  USING (public.hod_has_department(auth.uid(), department_id))
  WITH CHECK (public.hod_has_department(auth.uid(), department_id));

CREATE POLICY "Authenticated users can view subjects" ON public.subjects FOR SELECT TO authenticated
  USING (true);

-- FACULTY_SUBJECTS
CREATE POLICY "Admins can manage faculty_subjects" ON public.faculty_subjects FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "HOD can manage faculty_subjects in own department" ON public.faculty_subjects FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.subjects s
      WHERE s.id = faculty_subjects.subject_id
        AND public.hod_has_department(auth.uid(), s.department_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.subjects s
      WHERE s.id = faculty_subjects.subject_id
        AND public.hod_has_department(auth.uid(), s.department_id)
    )
  );

CREATE POLICY "Faculty can view own subject assignments" ON public.faculty_subjects FOR SELECT TO authenticated
  USING (faculty_id = auth.uid());

-- SCHEDULES
CREATE POLICY "Admins can manage schedules" ON public.schedules FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "HOD can manage schedules in own department" ON public.schedules FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.classes c
      WHERE c.id = schedules.class_id
        AND public.hod_has_department(auth.uid(), c.department_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.classes c
      WHERE c.id = schedules.class_id
        AND public.hod_has_department(auth.uid(), c.department_id)
    )
  );

CREATE POLICY "Faculty can view own schedules" ON public.schedules FOR SELECT TO authenticated
  USING (faculty_id = auth.uid());

CREATE POLICY "Students can view class schedules" ON public.schedules FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.class_id = schedules.class_id
    )
  );

-- ROLE_INVITES
CREATE POLICY "Admins can manage role_invites" ON public.role_invites FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view invites for their email" ON public.role_invites FOR SELECT TO authenticated
  USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Schedule overlap prevention trigger
CREATE OR REPLACE FUNCTION public.check_schedule_overlap()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.schedules
    WHERE class_id = NEW.class_id
      AND day_of_week = NEW.day_of_week
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
      AND start_time < NEW.end_time
      AND end_time > NEW.start_time
  ) THEN
    RAISE EXCEPTION 'Schedule overlap: this class already has a session at this time';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.schedules
    WHERE faculty_id = NEW.faculty_id
      AND day_of_week = NEW.day_of_week
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
      AND start_time < NEW.end_time
      AND end_time > NEW.start_time
  ) THEN
    RAISE EXCEPTION 'Schedule overlap: this faculty is already booked at this time';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS check_schedule_overlap_trigger ON public.schedules;
CREATE TRIGGER check_schedule_overlap_trigger
  BEFORE INSERT OR UPDATE ON public.schedules
  FOR EACH ROW
  EXECUTE FUNCTION public.check_schedule_overlap();
