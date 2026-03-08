import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useDepartmentSubjects, useDepartmentClasses, useDepartmentFaculty, useFacultySubjectAssignments } from '@/hooks/use-hod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function AssignFaculty({ departmentId }: { departmentId: string }) {
  const { subjects } = useDepartmentSubjects(departmentId);
  const { classes } = useDepartmentClasses(departmentId);
  const { faculty } = useDepartmentFaculty(departmentId);
  const { assignments, isLoading, refetch } = useFacultySubjectAssignments(departmentId);
  const [facultyId, setFacultyId] = useState('');
  const [classId, setClassId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [saving, setSaving] = useState(false);

  const handleAssign = async () => {
    if (!facultyId || !classId || !subjectId) {
      toast.error('Please select all fields');
      return;
    }
    setSaving(true);
    try {
      const { error } = await (supabase as any)
        .from('faculty_subjects')
        .insert({ faculty_id: facultyId, class_id: classId, subject_id: subjectId });
      if (error) {
        if (error.message?.includes('duplicate') || error.code === '23505') {
          toast.error('This assignment already exists');
        } else {
          throw error;
        }
      } else {
        // Also ensure faculty_classes entry exists
        await (supabase as any)
          .from('faculty_classes')
          .upsert({ faculty_id: facultyId, class_id: classId }, { onConflict: 'faculty_id,class_id', ignoreDuplicates: true });
        toast.success('Faculty assigned');
        setFacultyId(''); setClassId(''); setSubjectId('');
        refetch();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to assign');
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (id: string) => {
    const { error } = await (supabase as any).from('faculty_subjects').delete().eq('id', id);
    if (error) toast.error(error.message);
    else { toast.success('Assignment removed'); refetch(); }
  };

  if (isLoading) {
    return <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-12" />)}</div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground">Assign Faculty to Subjects</h2>

      <Card>
        <CardHeader><CardTitle className="text-base">New Assignment</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Faculty</Label>
              <Select value={facultyId} onValueChange={setFacultyId}>
                <SelectTrigger><SelectValue placeholder="Select faculty" /></SelectTrigger>
                <SelectContent>
                  {faculty.map(f => (
                    <SelectItem key={f.id} value={f.id}>{f.full_name || f.email}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Class</Label>
              <Select value={classId} onValueChange={setClassId}>
                <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                <SelectContent>
                  {classes.map(c => (
                    <SelectItem key={c.id} value={c.id}>Year {c.year} - {c.section}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Subject</Label>
              <Select value={subjectId} onValueChange={setSubjectId}>
                <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                <SelectContent>
                  {subjects.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.subject_code} - {s.subject_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={handleAssign} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}
            Assign
          </Button>
        </CardContent>
      </Card>

      {assignments.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">No assignments yet.</CardContent></Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Faculty</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead className="w-16"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignments.map(a => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">{a.faculty_name}</TableCell>
                      <TableCell>{a.class_label}</TableCell>
                      <TableCell>{a.subject_name}</TableCell>
                      <TableCell>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remove Assignment?</AlertDialogTitle>
                              <AlertDialogDescription>This will unassign the faculty from this subject.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleRemove(a.id)}>Remove</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
