import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';

export interface Subject {
  id: string;
  subject_code: string;
  subject_name: string;
  semester: number;
  department_id: string;
  created_at: string;
}

export interface FacultySubjectAssignment {
  id: string;
  faculty_id: string;
  class_id: string;
  subject_id: string;
  faculty_name?: string;
  class_label?: string;
  subject_name?: string;
}

export interface Schedule {
  id: string;
  class_id: string;
  subject_id: string;
  faculty_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  subject_name?: string;
  faculty_name?: string;
  class_label?: string;
}

export function useHodDepartment() {
  const { user } = useAuthContext();
  const [departmentId, setDepartmentId] = useState<string | null>(null);
  const [departmentName, setDepartmentName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) { setIsLoading(false); return; }
    const fetch = async () => {
      const { data } = await (supabase as any)
        .from('profiles')
        .select('department_id, departments:department_id(name)')
        .eq('id', user.id)
        .single();
      if (data?.department_id) {
        setDepartmentId(data.department_id);
        setDepartmentName(data.departments?.name || '');
      }
      setIsLoading(false);
    };
    fetch();
  }, [user]);

  return { departmentId, departmentName, isLoading };
}

export function useDepartmentSubjects(departmentId: string | null) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSubjects = useCallback(async () => {
    if (!departmentId) { setIsLoading(false); return; }
    setIsLoading(true);
    const { data } = await (supabase as any)
      .from('subjects')
      .select('*')
      .eq('department_id', departmentId)
      .order('semester', { ascending: true });
    setSubjects(data || []);
    setIsLoading(false);
  }, [departmentId]);

  useEffect(() => { fetchSubjects(); }, [fetchSubjects]);

  return { subjects, isLoading, refetch: fetchSubjects };
}

export function useDepartmentClasses(departmentId: string | null) {
  const [classes, setClasses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!departmentId) { setIsLoading(false); return; }
    const fetch = async () => {
      setIsLoading(true);
      const { data } = await (supabase as any)
        .from('classes')
        .select('id, year, section, department_id')
        .eq('department_id', departmentId)
        .order('year');
      setClasses(data || []);
      setIsLoading(false);
    };
    fetch();
  }, [departmentId]);

  return { classes, isLoading };
}

export function useDepartmentFaculty(departmentId: string | null) {
  const [faculty, setFaculty] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!departmentId) { setIsLoading(false); return; }
    const fetch = async () => {
      setIsLoading(true);
      // Get users with faculty role who belong to this department
      const { data: roles } = await (supabase as any)
        .from('user_roles')
        .select('user_id')
        .eq('role', 'faculty');
      
      if (!roles || roles.length === 0) {
        setFaculty([]);
        setIsLoading(false);
        return;
      }

      const facultyIds = roles.map((r: any) => r.user_id);
      const { data: profiles } = await (supabase as any)
        .from('profiles')
        .select('id, full_name, email')
        .in('id', facultyIds)
        .eq('department_id', departmentId);

      setFaculty(profiles || []);
      setIsLoading(false);
    };
    fetch();
  }, [departmentId]);

  return { faculty, isLoading };
}

export function useFacultySubjectAssignments(departmentId: string | null) {
  const [assignments, setAssignments] = useState<FacultySubjectAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAssignments = useCallback(async () => {
    if (!departmentId) { setIsLoading(false); return; }
    setIsLoading(true);
    const { data } = await (supabase as any)
      .from('faculty_subjects')
      .select('id, faculty_id, class_id, subject_id, subjects(subject_name, department_id), classes(year, section), profiles:faculty_id(full_name)')
      .eq('subjects.department_id', departmentId);

    const filtered = (data || []).filter((d: any) => d.subjects !== null);
    const mapped = filtered.map((d: any) => ({
      id: d.id,
      faculty_id: d.faculty_id,
      class_id: d.class_id,
      subject_id: d.subject_id,
      faculty_name: d.profiles?.full_name || 'Unknown',
      class_label: d.classes ? `Year ${d.classes.year} - ${d.classes.section}` : 'Unknown',
      subject_name: d.subjects?.subject_name || 'Unknown',
    }));
    setAssignments(mapped);
    setIsLoading(false);
  }, [departmentId]);

  useEffect(() => { fetchAssignments(); }, [fetchAssignments]);

  return { assignments, isLoading, refetch: fetchAssignments };
}

export function useDepartmentSchedules(departmentId: string | null) {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSchedules = useCallback(async () => {
    if (!departmentId) { setIsLoading(false); return; }
    setIsLoading(true);
    const { data } = await (supabase as any)
      .from('schedules')
      .select('*, subjects(subject_name), classes(year, section, department_id), profiles:faculty_id(full_name)')
      .eq('classes.department_id', departmentId);

    const filtered = (data || []).filter((d: any) => d.classes !== null);
    const mapped = filtered.map((d: any) => ({
      ...d,
      subject_name: d.subjects?.subject_name || '',
      faculty_name: d.profiles?.full_name || '',
      class_label: d.classes ? `Year ${d.classes.year} - ${d.classes.section}` : '',
    }));
    setSchedules(mapped);
    setIsLoading(false);
  }, [departmentId]);

  useEffect(() => { fetchSchedules(); }, [fetchSchedules]);

  return { schedules, isLoading, refetch: fetchSchedules };
}
