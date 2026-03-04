import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Building2, Plus, Trash2, Edit2, Loader2, GraduationCap } from 'lucide-react';
import { toast } from 'sonner';

interface Department {
  id: string;
  name: string;
  created_at: string;
}

interface ClassItem {
  id: string;
  department_id: string;
  year: number;
  section: string;
  department_name?: string;
}

export function AdminDepartments() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Dept form
  const [deptName, setDeptName] = useState('');
  const [editingDeptId, setEditingDeptId] = useState<string | null>(null);
  const [savingDept, setSavingDept] = useState(false);

  // Class form
  const [showClassForm, setShowClassForm] = useState(false);
  const [classDeptId, setClassDeptId] = useState('');
  const [classYear, setClassYear] = useState('1');
  const [classSection, setClassSection] = useState('');
  const [savingClass, setSavingClass] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [deptRes, classRes] = await Promise.all([
      (supabase as any).from('departments').select('*').order('name'),
      (supabase as any).from('classes').select('*, departments(name)').order('year'),
    ]);
    setDepartments(deptRes.data || []);
    setClasses((classRes.data || []).map((c: any) => ({
      ...c,
      department_name: c.departments?.name || 'Unknown',
    })));
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const saveDept = async () => {
    if (!deptName.trim()) { toast.error('Department name is required'); return; }
    setSavingDept(true);
    try {
      if (editingDeptId) {
        const { error } = await (supabase as any).from('departments').update({ name: deptName.trim() }).eq('id', editingDeptId);
        if (error) throw error;
        toast.success('Department updated');
      } else {
        const { error } = await (supabase as any).from('departments').insert({ name: deptName.trim() });
        if (error) throw error;
        toast.success('Department created');
      }
      setDeptName(''); setEditingDeptId(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSavingDept(false);
    }
  };

  const deleteDept = async (id: string) => {
    const { error } = await (supabase as any).from('departments').delete().eq('id', id);
    if (error) toast.error(error.message);
    else { toast.success('Department deleted'); fetchData(); }
  };

  const saveClass = async () => {
    if (!classDeptId || !classSection.trim()) {
      toast.error('Please fill all fields');
      return;
    }
    setSavingClass(true);
    try {
      const { error } = await (supabase as any).from('classes').insert({
        department_id: classDeptId,
        year: parseInt(classYear),
        section: classSection.trim().toUpperCase(),
      });
      if (error) throw error;
      toast.success('Class created');
      setShowClassForm(false);
      setClassSection('');
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSavingClass(false);
    }
  };

  const deleteClass = async (id: string) => {
    const { error } = await (supabase as any).from('classes').delete().eq('id', id);
    if (error) toast.error(error.message);
    else { toast.success('Class deleted'); fetchData(); }
  };

  if (loading) {
    return <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-16" />)}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Departments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5" /> Departments</CardTitle>
          <CardDescription>Manage academic departments</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Department name"
              value={deptName}
              onChange={e => setDeptName(e.target.value)}
              className="max-w-sm"
            />
            <Button onClick={saveDept} disabled={savingDept}>
              {savingDept ? <Loader2 className="h-4 w-4 animate-spin" /> : editingDeptId ? 'Update' : <><Plus className="h-4 w-4 mr-1" />Add</>}
            </Button>
            {editingDeptId && (
              <Button variant="outline" onClick={() => { setEditingDeptId(null); setDeptName(''); }}>Cancel</Button>
            )}
          </div>

          {departments.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No departments yet</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="text-right">Classes</TableHead>
                    <TableHead className="w-24">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {departments.map(d => (
                    <TableRow key={d.id}>
                      <TableCell className="font-medium">{d.name}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary">{classes.filter(c => c.department_id === d.id).length}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingDeptId(d.id); setDeptName(d.name); }}>
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Department?</AlertDialogTitle>
                                <AlertDialogDescription>This will remove all associated classes, subjects, and assignments.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteDept(d.id)}>Delete</AlertDialogAction>
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
          )}
        </CardContent>
      </Card>

      {/* Classes */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2"><GraduationCap className="h-5 w-5" /> Classes</CardTitle>
            <CardDescription>Manage classes per department</CardDescription>
          </div>
          <Button size="sm" onClick={() => setShowClassForm(true)}>
            <Plus className="h-4 w-4 mr-1" /> Add Class
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {showClassForm && (
            <div className="p-4 border rounded-lg space-y-3 bg-muted/30">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label>Department</Label>
                  <Select value={classDeptId} onValueChange={setClassDeptId}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Year</Label>
                  <Select value={classYear} onValueChange={setClassYear}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[1,2,3,4].map(y => <SelectItem key={y} value={String(y)}>Year {y}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Section</Label>
                  <Input placeholder="A" value={classSection} onChange={e => setClassSection(e.target.value)} />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={saveClass} disabled={savingClass}>
                  {savingClass ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create'}
                </Button>
                <Button variant="outline" onClick={() => setShowClassForm(false)}>Cancel</Button>
              </div>
            </div>
          )}

          {classes.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No classes yet</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Department</TableHead>
                    <TableHead>Year</TableHead>
                    <TableHead>Section</TableHead>
                    <TableHead className="w-16"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {classes.map(c => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.department_name}</TableCell>
                      <TableCell><Badge variant="secondary">Year {c.year}</Badge></TableCell>
                      <TableCell><Badge variant="outline">{c.section}</Badge></TableCell>
                      <TableCell>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Class?</AlertDialogTitle>
                              <AlertDialogDescription>This removes the class and all student assignments to it.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteClass(c.id)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
