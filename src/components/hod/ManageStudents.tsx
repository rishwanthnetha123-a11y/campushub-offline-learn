import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Users, UserPlus, ArrowRight, Loader2, Search, Upload, FileSpreadsheet, X, CheckCircle2, AlertCircle } from 'lucide-react';

interface StudentProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  roll_no: string | null;
  phone: string | null;
  class_id: string | null;
}

interface ClassOption {
  id: string;
  year: number;
  section: string;
}

interface CsvRow {
  name: string;
  email: string;
  status?: 'pending' | 'success' | 'error' | 'exists';
  message?: string;
}

interface Props {
  departmentId: string;
  departmentName: string;
}

export function ManageStudents({ departmentId, departmentName }: Props) {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [unassigned, setUnassigned] = useState<StudentProfile[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<Record<string, string>>({});

  // Search
  const [searchQuery, setSearchQuery] = useState('');

  // CSV Import
  const [csvRows, setCsvRows] = useState<CsvRow[]>([]);
  const [csvClassId, setCsvClassId] = useState<string>('');
  const [importing, setImporting] = useState(false);
  const [showImport, setShowImport] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    // Fetch classes, all dept profiles, unassigned profiles, and non-student role user IDs
    const [{ data: cls }, { data: deptProfiles }, { data: noDepProfiles }, { data: roleData }] = await Promise.all([
      (supabase as any).from('classes').select('id, year, section').eq('department_id', departmentId).order('year'),
      (supabase as any).from('profiles').select('id, full_name, email, roll_no, phone, class_id').eq('department_id', departmentId).order('full_name'),
      (supabase as any).from('profiles').select('id, full_name, email, roll_no, phone, class_id').is('department_id', null).order('full_name'),
      (supabase as any).from('user_roles').select('user_id, role'),
    ]);

    // Build a set of user IDs that have faculty, hod, or admin roles
    const nonStudentIds = new Set(
      (roleData || [])
        .filter((r: any) => r.role === 'faculty' || r.role === 'hod' || r.role === 'admin')
        .map((r: any) => r.user_id)
    );

    setClasses(cls || []);
    setStudents((deptProfiles || []).filter((p: any) => !nonStudentIds.has(p.id)));
    setUnassigned((noDepProfiles || []).filter((p: any) => !nonStudentIds.has(p.id)));
    setLoading(false);
  }, [departmentId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Filter helper
  const matchesSearch = (s: StudentProfile) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (s.full_name?.toLowerCase().includes(q)) || (s.email?.toLowerCase().includes(q));
  };

  const assignToClass = async (studentId: string, classId: string) => {
    setSaving(studentId);
    const { error } = await (supabase as any).from('profiles').update({ class_id: classId }).eq('id', studentId);
    if (error) {
      toast({ title: 'Failed to assign', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Student assigned' });
      fetchData();
    }
    setSaving(null);
  };

  const addToDepartment = async (studentId: string) => {
    const classId = selectedClass[studentId];
    setSaving(studentId);
    const { error } = await (supabase as any).from('profiles').update({ department_id: departmentId, class_id: classId || null }).eq('id', studentId);
    if (error) {
      toast({ title: 'Failed to add', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Student added', description: `Added to ${departmentName}.` });
      fetchData();
    }
    setSaving(null);
  };

  const removeFromDepartment = async (studentId: string) => {
    setSaving(studentId);
    const { error } = await (supabase as any).from('profiles').update({ department_id: null, class_id: null }).eq('id', studentId);
    if (error) {
      toast({ title: 'Failed to remove', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Student removed' });
      fetchData();
    }
    setSaving(null);
  };

  // CSV parsing
  const handleCsvFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.csv')) {
      toast({ title: 'Invalid file', description: 'Please upload a .csv file', variant: 'destructive' });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Max 2MB', variant: 'destructive' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length < 2) {
        toast({ title: 'Empty CSV', description: 'CSV must have a header row and at least one data row.', variant: 'destructive' });
        return;
      }

      // Parse header
      const header = lines[0].toLowerCase().split(',').map(h => h.trim().replace(/"/g, ''));
      const nameIdx = header.findIndex(h => h === 'name' || h === 'full_name' || h === 'student_name');
      const emailIdx = header.findIndex(h => h === 'email' || h === 'email_address');

      if (nameIdx === -1 || emailIdx === -1) {
        toast({ title: 'Invalid CSV format', description: 'CSV must have "name" and "email" columns.', variant: 'destructive' });
        return;
      }

      const rows: CsvRow[] = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map(c => c.trim().replace(/"/g, ''));
        const name = cols[nameIdx]?.trim();
        const email = cols[emailIdx]?.trim().toLowerCase();
        if (name && email && email.includes('@')) {
          if (name.length <= 100 && email.length <= 255) {
            rows.push({ name, email, status: 'pending' });
          }
        }
      }

      if (rows.length === 0) {
        toast({ title: 'No valid rows', description: 'No valid name/email pairs found.', variant: 'destructive' });
        return;
      }

      setCsvRows(rows);
      setShowImport(true);
    };
    reader.readAsText(file);
    // Reset file input
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleBulkImport = async () => {
    if (!csvClassId) {
      toast({ title: 'Select a class', description: 'Please select a class for the imported students.', variant: 'destructive' });
      return;
    }

    setImporting(true);
    const updated = [...csvRows];

    for (let i = 0; i < updated.length; i++) {
      const row = updated[i];

      // Check if a profile with this email already exists
      const { data: existing } = await (supabase as any)
        .from('profiles')
        .select('id, department_id')
        .eq('email', row.email)
        .maybeSingle();

      if (existing) {
        if (existing.department_id && existing.department_id !== departmentId) {
          updated[i] = { ...row, status: 'error', message: 'Already in another department' };
        } else {
          // Assign to this department + class
          const { error } = await (supabase as any)
            .from('profiles')
            .update({ department_id: departmentId, class_id: csvClassId, full_name: row.name })
            .eq('id', existing.id);
          updated[i] = error
            ? { ...row, status: 'error', message: error.message }
            : { ...row, status: 'success', message: 'Assigned to class' };
        }
      } else {
        updated[i] = { ...row, status: 'exists', message: 'No account found — student must sign up first' };
      }

      setCsvRows([...updated]);
    }

    const successCount = updated.filter(r => r.status === 'success').length;
    toast({ title: 'Import complete', description: `${successCount} of ${updated.length} students assigned.` });
    setImporting(false);
    fetchData();
  };

  if (loading) {
    return <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>;
  }

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

  const filteredUnassigned = unassigned.filter(matchesSearch);

  return (
    <div className="space-y-6">
      {/* Search + Import toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search students by name or email..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleCsvFile} />
          <Button variant="outline" className="gap-2" onClick={() => fileRef.current?.click()}>
            <Upload className="h-4 w-4" />
            Import CSV
          </Button>
        </div>
      </div>

      {/* CSV Import Panel */}
      {showImport && (
        <Card className="border-primary/30">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5" />
                Bulk Import — {csvRows.length} students
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => { setShowImport(false); setCsvRows([]); }}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <CardDescription>
              Assign all imported students to a class. Students must have existing accounts (signed up via email or phone).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Select value={csvClassId} onValueChange={setCsvClassId}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map(c => (
                    <SelectItem key={c.id} value={c.id}>Year {c.year} – Sec {c.section}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleBulkImport} disabled={importing || !csvClassId} className="gap-2">
                {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                {importing ? 'Importing...' : 'Import All'}
              </Button>
            </div>

            <div className="space-y-1 max-h-[250px] overflow-y-auto">
              {csvRows.map((row, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-lg border text-sm">
                  <div className="flex items-center gap-2">
                    {row.status === 'success' && <CheckCircle2 className="h-3.5 w-3.5 text-primary" />}
                    {row.status === 'error' && <AlertCircle className="h-3.5 w-3.5 text-destructive" />}
                    {row.status === 'exists' && <AlertCircle className="h-3.5 w-3.5 text-accent" />}
                    <span className="font-medium text-foreground">{row.name}</span>
                    <span className="text-muted-foreground">{row.email}</span>
                  </div>
                  {row.message && (
                    <span className={`text-xs ${row.status === 'success' ? 'text-primary' : row.status === 'error' ? 'text-destructive' : 'text-accent'}`}>
                      {row.message}
                    </span>
                  )}
                </div>
              ))}
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                CSV format: <code className="bg-muted px-1 rounded">name,email</code> columns required. Students must have an existing account to be assigned.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Students in department */}
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
              {unassignedInDept.length > 0 && (
                <div>
                  <h3 className="font-semibold text-foreground text-sm mb-2">Not assigned to any class</h3>
                  <div className="space-y-2">
                    {unassignedInDept.filter(matchesSearch).map(s => (
                      <div key={s.id} className="flex items-center justify-between p-3 rounded-lg border">
                        <div>
                          <p className="text-sm font-medium text-foreground">{s.full_name || 'Unnamed'}</p>
                          <p className="text-xs text-muted-foreground">Roll: {s.roll_no || '—'} • Phone: {s.phone || '—'}</p>
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

              {classes.map(cls => {
                const classStudents = (studentsByClass[cls.id] || []).filter(matchesSearch);
                if (classStudents.length === 0 && searchQuery) return null;
                return (
                  <div key={cls.id}>
                    <h3 className="font-semibold text-foreground text-sm mb-2 flex items-center gap-2">
                      Year {cls.year} – Section {cls.section}
                      <Badge variant="secondary" className="text-xs">{(studentsByClass[cls.id] || []).length} students</Badge>
                    </h3>
                    {classStudents.length === 0 ? (
                      <p className="text-xs text-muted-foreground py-2">{searchQuery ? 'No matches' : 'No students in this class'}</p>
                    ) : (
                      <div className="space-y-1">
                        {classStudents.map(s => (
                          <div key={s.id} className="flex items-center justify-between p-2.5 rounded-lg border">
                            <div>
                              <p className="text-sm font-medium text-foreground">{s.full_name || 'Unnamed'}</p>
                              <p className="text-xs text-muted-foreground">Roll: {s.roll_no || '—'} • Phone: {s.phone || '—'}</p>
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
                    )}
                  </div>
                );
              })}
            </>
          )}
        </CardContent>
      </Card>

      {/* Unassigned students */}
      {filteredUnassigned.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Unassigned Students
            </CardTitle>
            <CardDescription>
              {searchQuery ? `${filteredUnassigned.length} matches` : `${unassigned.length} students`} not assigned to any department
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {filteredUnassigned.map(s => (
                <div key={s.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="text-sm font-medium text-foreground">{s.full_name || 'Unnamed'}</p>
                    <p className="text-xs text-muted-foreground">Roll: {s.roll_no || '—'} • Phone: {s.phone || '—'}</p>
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
