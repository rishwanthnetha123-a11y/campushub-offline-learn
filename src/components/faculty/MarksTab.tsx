import { useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { useClassStudents, useFacultySubjects } from '@/hooks/use-faculty';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Save, Loader2, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';

export function MarksTab({ classId }: { classId: string }) {
  const { user } = useAuthContext();
  const { students, isLoading } = useClassStudents(classId);
  const { subjects } = useFacultySubjects();
  const classSubjects = subjects.filter(s => s.class_id === classId);

  const [subjectId, setSubjectId] = useState('');
  const [examType, setExamType] = useState('internal_1');
  const [maxMarks, setMaxMarks] = useState('100');
  const [marks, setMarks] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const selectedSubject = classSubjects.find(s => s.subject_id === subjectId);

  // Compute live average
  const { filledCount, avgMarks } = useMemo(() => {
    const entries = Object.values(marks).filter(v => v !== '' && v !== undefined);
    const max = parseFloat(maxMarks) || 100;
    const total = entries.reduce((sum, v) => sum + ((parseFloat(v) || 0) / max * 100), 0);
    return { filledCount: entries.length, avgMarks: entries.length > 0 ? Math.round(total / entries.length) : 0 };
  }, [marks, maxMarks]);

  const handleSave = async () => {
    if (!user || !subjectId) {
      toast.error('Please select a subject');
      return;
    }
    const max = parseFloat(maxMarks) || 100;
    
    // Validate marks
    for (const [sid, val] of Object.entries(marks)) {
      if (val !== '' && val !== undefined) {
        const num = parseFloat(val);
        if (isNaN(num) || num < 0 || num > max) {
          toast.error(`Invalid marks value: ${val}. Must be between 0 and ${max}`);
          return;
        }
      }
    }

    setSaving(true);
    try {
      const rows = students
        .filter(s => marks[s.id] !== undefined && marks[s.id] !== '')
        .map(s => ({
          student_id: s.id,
          class_id: classId,
          subject: selectedSubject?.subject_name || '',
          subject_id: subjectId,
          exam_type: examType,
          marks_obtained: parseFloat(marks[s.id]) || 0,
          max_marks: max,
          entered_by: user.id,
        }));

      if (rows.length === 0) {
        toast.error('Please enter marks for at least one student');
        setSaving(false);
        return;
      }

      const { error } = await (supabase as any).from('marks').insert(rows);
      if (error) throw error;
      toast.success(`Marks saved for ${rows.length} students`);
      setMarks({});
    } catch (err: any) {
      toast.error(err.message || 'Failed to save marks');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-12" />)}</div>;
  }

  return (
    <div className="space-y-4">
      {/* Config */}
      <Card>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Subject</Label>
              <Select value={subjectId} onValueChange={setSubjectId}>
                <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                <SelectContent>
                  {classSubjects.map(s => (
                    <SelectItem key={s.subject_id} value={s.subject_id}>{s.subject_code} - {s.subject_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Exam Type</Label>
              <Select value={examType} onValueChange={setExamType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="internal_1">Internal 1</SelectItem>
                  <SelectItem value="internal_2">Internal 2</SelectItem>
                  <SelectItem value="model">Model</SelectItem>
                  <SelectItem value="lab">Lab</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Max Marks</Label>
              <Input type="number" value={maxMarks} onChange={e => setMaxMarks(e.target.value)} min={1} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Live stats */}
      {filledCount > 0 && (
        <div className="flex gap-3">
          <Badge variant="secondary" className="gap-1"><BarChart3 className="h-3 w-3" /> {filledCount} entered</Badge>
          <Badge variant="secondary">Avg: {avgMarks}%</Badge>
        </div>
      )}

      {/* Student marks */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Enter Marks</CardTitle></CardHeader>
        <CardContent>
          {students.length === 0 ? (
            <p className="text-muted-foreground text-center py-6">No students in this class.</p>
          ) : (
            <>
              <div className="space-y-2">
                {students.map((student, idx) => (
                  <div key={student.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-6 text-center font-mono">{idx + 1}</span>
                      <div>
                        <p className="text-sm font-medium text-foreground">{student.full_name || 'Unnamed'}</p>
                        <p className="text-xs text-muted-foreground">{student.email}</p>
                      </div>
                    </div>
                    <Input
                      type="number"
                      placeholder="Marks"
                      className="w-24"
                      value={marks[student.id] || ''}
                      onChange={e => setMarks(prev => ({ ...prev, [student.id]: e.target.value }))}
                      min={0}
                      max={parseFloat(maxMarks) || 100}
                    />
                  </div>
                ))}
              </div>
              <Button onClick={handleSave} disabled={saving || !subjectId} className="mt-4 w-full sm:w-auto">
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save Marks
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
