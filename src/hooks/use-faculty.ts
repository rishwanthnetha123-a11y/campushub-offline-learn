import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';

export function useFacultyRole() {
  const { user } = useAuthContext();
  const [isFaculty, setIsFaculty] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsFaculty(false);
      setIsLoading(false);
      return;
    }

    const check = async () => {
      const { data } = await (supabase as any)
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'faculty')
        .maybeSingle();
      setIsFaculty(!!data);
      setIsLoading(false);
    };
    check();
  }, [user]);

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

    // Get faculty class assignments
    const { data: assignments, error } = await (supabase as any)
      .from('faculty_classes')
      .select('id, class_id, classes(id, year, section, department_id, departments(name))')
      .eq('faculty_id', user.id);

    if (error || !assignments) {
      setClasses([]);
      setIsLoading(false);
      return;
    }

    // For each class, count students
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
