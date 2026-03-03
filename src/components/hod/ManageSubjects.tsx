import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useDepartmentSubjects, Subject } from '@/hooks/use-hod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Trash2, Edit2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function ManageSubjects({ departmentId }: { departmentId: string }) {
  const { subjects, isLoading, refetch } = useDepartmentSubjects(departmentId);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [semester, setSemester] = useState('1');
  const [saving, setSaving] = useState(false);

  const resetForm = () => {
    setCode(''); setName(''); setSemester('1');
    setEditingId(null); setShowForm(false);
  };

  const startEdit = (s: Subject) => {
    setEditingId(s.id);
    setCode(s.subject_code);
    setName(s.subject_name);
    setSemester(String(s.semester));
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!code.trim() || !name.trim()) {
      toast.error('Please fill all fields');
      return;
    }
    const sem = parseInt(semester);
    if (sem < 1 || sem > 8) {
      toast.error('Semester must be between 1 and 8');
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        const { error } = await (supabase as any)
          .from('subjects')
          .update({ subject_code: code.trim(), subject_name: name.trim(), semester: sem })
          .eq('id', editingId);
        if (error) throw error;
        toast.success('Subject updated');
      } else {
        const { error } = await (supabase as any)
          .from('subjects')
          .insert({ subject_code: code.trim(), subject_name: name.trim(), semester: sem, department_id: departmentId });
        if (error) throw error;
        toast.success('Subject created');
      }
      resetForm();
      refetch();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await (supabase as any).from('subjects').delete().eq('id', id);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Subject deleted');
      refetch();
    }
  };

  if (isLoading) {
    return <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-12" />)}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Subjects</h2>
        <Button size="sm" onClick={() => { resetForm(); setShowForm(true); }}>
          <Plus className="h-4 w-4 mr-1" /> Add Subject
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle className="text-base">{editingId ? 'Edit' : 'New'} Subject</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Subject Code</Label>
                <Input placeholder="CS101" value={code} onChange={e => setCode(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Subject Name</Label>
                <Input placeholder="Data Structures" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Semester</Label>
                <Select value={semester} onValueChange={setSemester}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[1,2,3,4,5,6,7,8].map(s => (
                      <SelectItem key={s} value={String(s)}>Semester {s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                {editingId ? 'Update' : 'Create'}
              </Button>
              <Button variant="outline" onClick={resetForm}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {subjects.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">No subjects yet. Add your first subject.</CardContent></Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Semester</TableHead>
                    <TableHead className="w-24">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subjects.map(s => (
                    <TableRow key={s.id}>
                      <TableCell className="font-mono text-sm">{s.subject_code}</TableCell>
                      <TableCell className="font-medium">{s.subject_name}</TableCell>
                      <TableCell><Badge variant="secondary">Sem {s.semester}</Badge></TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(s)}>
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Subject?</AlertDialogTitle>
                                <AlertDialogDescription>This will also remove all faculty assignments and schedules for this subject.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(s.id)}>Delete</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
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
