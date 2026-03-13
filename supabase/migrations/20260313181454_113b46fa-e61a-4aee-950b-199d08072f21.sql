
-- Exams table
CREATE TABLE public.exams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  total_marks INTEGER NOT NULL DEFAULT 100,
  starts_at TIMESTAMP WITH TIME ZONE,
  ends_at TIMESTAMP WITH TIME ZONE,
  is_published BOOLEAN NOT NULL DEFAULT false,
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Exam submissions table
CREATE TABLE public.exam_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id),
  answers JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_marks_obtained NUMERIC DEFAULT NULL,
  is_graded BOOLEAN NOT NULL DEFAULT false,
  graded_by UUID REFERENCES public.profiles(id),
  grades JSONB NOT NULL DEFAULT '[]'::jsonb,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  graded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(exam_id, student_id)
);

-- RLS for exams
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Faculty can manage own exams" ON public.exams
  FOR ALL TO authenticated
  USING (created_by = auth.uid() AND has_role(auth.uid(), 'faculty'::app_role))
  WITH CHECK (created_by = auth.uid() AND has_role(auth.uid(), 'faculty'::app_role));

CREATE POLICY "Admins can manage all exams" ON public.exams
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Students can view published exams for their class" ON public.exams
  FOR SELECT TO authenticated
  USING (is_published = true AND EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.class_id = exams.class_id
  ));

-- RLS for exam_submissions
ALTER TABLE public.exam_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can manage own submissions" ON public.exam_submissions
  FOR ALL TO authenticated
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Faculty can view submissions for own exams" ON public.exam_submissions
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM exams e WHERE e.id = exam_submissions.exam_id AND e.created_by = auth.uid()
  ));

CREATE POLICY "Faculty can update submissions for own exams" ON public.exam_submissions
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM exams e WHERE e.id = exam_submissions.exam_id AND e.created_by = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM exams e WHERE e.id = exam_submissions.exam_id AND e.created_by = auth.uid()
  ));

CREATE POLICY "Admins can manage all submissions" ON public.exam_submissions
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
