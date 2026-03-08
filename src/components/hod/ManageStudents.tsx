import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Users, UserPlus, ArrowRight, Loader2 } from 'lucide-react';

interface StudentProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  class_id: string | null;
}

interface ClassOption {
  id: string;
  year: number;
  section: string;
}

interface Props {
  departmentId: string;
  departmentName: string;
}

export function ManageStudents({ departmentId, departmentName }: Props) {
  const { toast } = useToast();
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [unassigned, setUnassigned] = useState<StudentProfile[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<Record<string, string>>({});

  const fetchData = useCallback(async () => {
    setLoading(true);

    // Fetch classes in this department
    const { data: cls } = await (supabase as any)
      .from('classes')
      .select('id, year, section')
      .eq('department_id', departmentId)
      .order('year');
    setClasses(cls || []);

    // Fetch students already in this department
    const { data: deptStudents } = await (supabase as any)
      .from('profiles')
      .select('id, full_name, email, class_id')
      .eq('department_id', departmentId)
      .order('full_name');
    setStudents(deptStudents || []);

    // Fetch profiles with no department assigned (potential new students)
    const { data: noDepStudents } = await (supabase as any)
      .from('profiles')
      .select('id, full_name, email, class_id')
      .is('department_id', null)
      .order('full_name');
    setUnassigned(noDepStudents || []);

    setLoading(false);
  }, [departmentId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const assignToClass = async (studentId: string, classId: string) => {
    setSaving(studentId);
    const { error } = await (supabase as any)
      .from('profiles')
      .update({ class_id: classId })
      .eq('id', studentId);

    if (error) {
      toast({ title: 'Failed to assign', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Student assigned', description: 'Student has been assigned to the class.' });
      fetchData();
    }
    setSaving(null);
  };

  const addToDepartment = async (studentId: string) => {
    const classId = selectedClass[studentId];
    setSaving(studentId);
    const { error } = await (supabase as any)
      .from('profiles')
      .update({ department_id: departmentId, class_id: classId || null })
      .eq('id', studentId);

    if (error) {
      toast({ title: 'Failed to add', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Student added', description: `Student added to ${departmentName}.` });
      fetchData();
    }
    setSaving(null);
  };

  const removeFromDepartment = async (studentId: string) => {
    setSaving(studentId);
    const { error } = await (supabase as any)
      .from('profiles')
      .update({ department_id: null, class_id: null })
      .eq('id', studentId);

    if (error) {
      toast({ title: 'Failed to remove', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Student removed', description: 'Student removed from department.' });
      fetchData();
    }
    setSaving(null);
  };

  if (loading) {
    return <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>;
  }

  const getClassLabel = (classId: string | null) => {
    if (!classId) return 'Unassigned';
    const cls = classes.find(c => c.id === classId);
    return cls ? `Year ${cls.year} – Sec ${cls.section}` : 'Unknown';
  };

  // Group students by class
  const studentsByClass: Record<string, StudentProfile[]> = {};
  const unassignedInDept: StudentProfile[] = [];
  students.forEach(s => {
    if (s.class_id) {
      if (!studentsByClass[s.class_id]) studentsByClass[s.class_id] = [];
      studentsByClass[s.class_id].push(s);
    } else {
      unassignedInDept.push(s);
    }
  });

  return (
    <div className="space-y-6">
      {/* Students in department grouped by class */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5" />
            Students in {departmentName}
          </CardTitle>
          <CardDescription>{students.length} students in department</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {students.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No students in this department yet.</p>
          ) : (
            <>
              {/* Students without a class */}
              {unassignedInDept.length > 0 && (
                <div>
                  <h3 className="font-semibold text-foreground text-sm mb-2">Not assigned to any class</h3>
                  <div className="space-y-2">
                    {unassignedInDept.map(s => (
                      <div key={s.id} className="flex items-center justify-between p-3 rounded-lg border">
                        <div>
                          <p className="text-sm font-medium text-foreground">{s.full_name || 'Unnamed'}</p>
                          <p className="text-xs text-muted-foreground">{s.email}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Select onValueChange={(v) => assignToClass(s.id, v)}>
                            <SelectTrigger className="w-[160px] h-8 text-xs">
                              <SelectValue placeholder="Assign to class" />
                            </SelectTrigger>
                            <SelectContent>
                              {classes.map(c => (
                                <SelectItem key={c.id} value={c.id}>Year {c.year} – Sec {c.section}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button variant="ghost" size="sm" className="text-xs text-destructive" onClick={() => removeFromDepartment(s.id)} disabled={saving === s.id}>
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Students grouped by class */}
              {classes.map(cls => {
                const classStudents = studentsByClass[cls.id] || [];
                if (classStudents.length === 0) return null;
                return (
                  <div key={cls.id}>
                    <h3 className="font-semibold text-foreground text-sm mb-2 flex items-center gap-2">
                      Year {cls.year} – Section {cls.section}
                      <Badge variant="secondary" className="text-xs">{classStudents.length} students</Badge>
                    </h3>
                    <div className="space-y-1">
                      {classStudents.map(s => (
                        <div key={s.id} className="flex items-center justify-between p-2.5 rounded-lg border">
                          <div>
                            <p className="text-sm font-medium text-foreground">{s.full_name || 'Unnamed'}</p>
                            <p className="text-xs text-muted-foreground">{s.email}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Select defaultValue={s.class_id || undefined} onValueChange={(v) => assignToClass(s.id, v)}>
                              <SelectTrigger className="w-[160px] h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {classes.map(c => (
                                  <SelectItem key={c.id} value={c.id}>Year {c.year} – Sec {c.section}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button variant="ghost" size="sm" className="text-xs text-destructive" onClick={() => removeFromDepartment(s.id)} disabled={saving === s.id}>
                              Remove
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </CardContent>
      </Card>

      {/* Add unassigned students to department */}
      {unassigned.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Unassigned Students
            </CardTitle>
            <CardDescription>{unassigned.length} students not assigned to any department</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {unassigned.map(s => (
                <div key={s.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="text-sm font-medium text-foreground">{s.full_name || 'Unnamed'}</p>
                    <p className="text-xs text-muted-foreground">{s.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select onValueChange={(v) => setSelectedClass(prev => ({ ...prev, [s.id]: v }))}>
                      <SelectTrigger className="w-[160px] h-8 text-xs">
                        <SelectValue placeholder="Select class" />
                      </SelectTrigger>
                      <SelectContent>
                        {classes.map(c => (
                          <SelectItem key={c.id} value={c.id}>Year {c.year} – Sec {c.section}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button size="sm" className="gap-1 text-xs" onClick={() => addToDepartment(s.id)} disabled={saving === s.id}>
                      {saving === s.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <ArrowRight className="h-3 w-3" />}
                      Add
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
