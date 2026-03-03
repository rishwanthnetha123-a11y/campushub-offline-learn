import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';

export function useFacultyRole() {
  const { isFaculty, isLoading } = useAuthContext();
  return { isFaculty, isLoading };
}

export interface FacultyClass {
  id: string;
  class_id: string;
  department_name: string;
  year: number;
  section: string;
  student_count: number;
}

export function useFacultyClasses() {
  const { user } = useAuthContext();
  const [classes, setClasses] = useState<FacultyClass[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchClasses();
  }, [user]);

  const fetchClasses = async () => {
    if (!user) return;
    setIsLoading(true);

    const { data: assignments, error } = await (supabase as any)
      .from('faculty_classes')
      .select('id, class_id, classes(id, year, section, department_id, departments(name))')
      .eq('faculty_id', user.id);

    if (error || !assignments) {
      setClasses([]);
      setIsLoading(false);
      return;
    }

    const result: FacultyClass[] = [];
    for (const a of assignments) {
      const cls = a.classes;
      if (!cls) continue;

      const { count } = await (supabase as any)
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('class_id', cls.id);

      result.push({
        id: a.id,
        class_id: cls.id,
        department_name: cls.departments?.name ?? 'Unknown',
        year: cls.year,
        section: cls.section,
        student_count: count ?? 0,
      });
    }

    setClasses(result);
    setIsLoading(false);
  };

  return { classes, isLoading, refetch: fetchClasses };
}

export interface FacultySubject {
  id: string;
  subject_id: string;
  class_id: string;
  subject_code: string;
  subject_name: string;
  class_label: string;
}

export function useFacultySubjects() {
  const { user } = useAuthContext();
  const [subjects, setSubjects] = useState<FacultySubject[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      setIsLoading(true);
      const { data } = await (supabase as any)
        .from('faculty_subjects')
        .select('id, subject_id, class_id, subjects(subject_code, subject_name), classes(year, section)')
        .eq('faculty_id', user.id);

      const mapped = (data || []).map((d: any) => ({
        id: d.id,
        subject_id: d.subject_id,
        class_id: d.class_id,
        subject_code: d.subjects?.subject_code || '',
        subject_name: d.subjects?.subject_name || '',
        class_label: d.classes ? `Year ${d.classes.year} - ${d.classes.section}` : '',
      }));
      setSubjects(mapped);
      setIsLoading(false);
    };
    fetch();
  }, [user]);

  return { subjects, isLoading };
}

export function useFacultyScheduleToday() {
  const { user } = useAuthContext();
  const [schedule, setSchedule] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      setIsLoading(true);
      const today = new Date().getDay(); // 0=Sunday
      const { data } = await (supabase as any)
        .from('schedules')
        .select('*, subjects(subject_name), classes(year, section)')
        .eq('faculty_id', user.id)
        .eq('day_of_week', today)
        .order('start_time');

      setSchedule((data || []).map((d: any) => ({
        ...d,
        subject_name: d.subjects?.subject_name || '',
        class_label: d.classes ? `Year ${d.classes.year} - ${d.classes.section}` : '',
      })));
      setIsLoading(false);
    };
    fetch();
  }, [user]);

  return { schedule, isLoading };
}

export interface ClassStudent {
  id: string;
  full_name: string | null;
  email: string | null;
}

export function useClassStudents(classId: string | undefined) {
  const [students, setStudents] = useState<ClassStudent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!classId) return;
    fetchStudents();
  }, [classId]);

  const fetchStudents = async () => {
    if (!classId) return;
    setIsLoading(true);
    const { data } = await (supabase as any)
      .from('profiles')
      .select('id, full_name, email')
      .eq('class_id', classId)
      .order('full_name');

    setStudents(data ?? []);
    setIsLoading(false);
  };

  return { students, isLoading, refetch: fetchStudents };
}
