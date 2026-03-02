import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { useClassStudents } from '@/hooks/use-faculty';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function MarksTab({ classId }: { classId: string }) {
  const { user } = useAuthContext();
  const { students, isLoading } = useClassStudents(classId);
  const [subject, setSubject] = useState('');
  const [examType, setExamType] = useState('internal_1');
  const [maxMarks, setMaxMarks] = useState('100');
  const [marks, setMarks] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!user || !subject.trim()) {
      toast.error('Please enter a subject name');
      return;
    }
    setSaving(true);
    try {
      const rows = students
        .filter(s => marks[s.id] !== undefined && marks[s.id] !== '')
        .map(s => ({
          student_id: s.id,
          class_id: classId,
          subject: subject.trim(),
          exam_type: examType,
          marks_obtained: parseFloat(marks[s.id]) || 0,
          max_marks: parseFloat(maxMarks) || 100,
          entered_by: user.id,
        }));

      if (rows.length === 0) {
        toast.error('Please enter marks for at least one student');
        setSaving(false);
        return;
      }

      const { error } = await (supabase as any)
        .from('marks')
        .insert(rows);

      if (error) throw error;
      toast.success('Marks saved successfully');
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
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Enter Marks</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Config row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label>Subject</Label>
            <Input placeholder="e.g. Mathematics" value={subject} onChange={e => setSubject(e.target.value)} />
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
            <Input type="number" value={maxMarks} onChange={e => setMaxMarks(e.target.value)} />
          </div>
        </div>

        {/* Student marks */}
        {students.length === 0 ? (
          <p className="text-muted-foreground text-center py-6">No students in this class.</p>
        ) : (
          <div className="space-y-2">
            {students.map((student, idx) => (
              <div key={student.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-6">{idx + 1}</span>
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
        )}

        <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Save Marks
        </Button>
      </CardContent>
    </Card>
  );
}
