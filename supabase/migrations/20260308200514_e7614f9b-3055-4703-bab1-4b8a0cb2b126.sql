
-- Add unique constraint for upsert support
ALTER TABLE public.faculty_classes 
ADD CONSTRAINT faculty_classes_faculty_class_unique UNIQUE (faculty_id, class_id);

-- Backfill: insert missing faculty_classes from existing faculty_subjects
INSERT INTO public.faculty_classes (faculty_id, class_id)
SELECT DISTINCT faculty_id, class_id FROM public.faculty_subjects
ON CONFLICT (faculty_id, class_id) DO NOTHING;
