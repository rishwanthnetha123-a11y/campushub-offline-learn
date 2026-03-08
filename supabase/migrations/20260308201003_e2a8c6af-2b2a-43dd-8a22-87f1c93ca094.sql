
-- Drop the old unique constraint (per class per day)
ALTER TABLE public.attendance DROP CONSTRAINT attendance_student_id_class_id_date_key;

-- Add new unique constraint including subject_id (per subject per class per day)
ALTER TABLE public.attendance ADD CONSTRAINT attendance_student_class_date_subject_unique 
  UNIQUE (student_id, class_id, date, subject_id);
