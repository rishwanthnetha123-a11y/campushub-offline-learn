import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { useClassStudents, useFacultySubjects } from '@/hooks/use-faculty';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, Save, Loader2, CheckCircle, XCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface AttendanceRecord {
  student_id: string;
  status: string;
}

export function AttendanceTab({ classId }: { classId: string }) {
  const { user } = useAuthContext();
  const { students, isLoading: studentsLoading } = useClassStudents(classId);
  const { subjects } = useFacultySubjects();
  const classSubjects = subjects.filter(s => s.class_id === classId);

  const [date, setDate] = useState<Date>(new Date());
  const [subjectId, setSubjectId] = useState('');
  const [records, setRecords] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [loadingRecords, setLoadingRecords] = useState(false);

  const dateStr = format(date, 'yyyy-MM-dd');

  // Auto-select first subject
  useEffect(() => {
    if (classSubjects.length > 0 && !subjectId) {
      setSubjectId(classSubjects[0].subject_id);
    }
  }, [classSubjects, subjectId]);

  // Load existing attendance for date + subject
  useEffect(() => {
    if (!subjectId) return;
    loadAttendance();
  }, [dateStr, classId, subjectId]);

  const loadAttendance = async () => {
    setLoadingRecords(true);
    let query = (supabase as any)
      .from('attendance')
      .select('student_id, status')
      .eq('class_id', classId)
      .eq('date', dateStr);
    
    if (subjectId) query = query.eq('subject_id', subjectId);

    const { data } = await query;

    const map: Record<string, string> = {};
    if (data) {
      (data as AttendanceRecord[]).forEach(r => { map[r.student_id] = r.status; });
    }
    students.forEach(s => { if (!map[s.id]) map[s.id] = 'present'; });
    setRecords(map);
    setLoadingRecords(false);
  };

  useEffect(() => {
    if (students.length > 0 && Object.keys(records).length === 0) {
      const map: Record<string, string> = {};
      students.forEach(s => { map[s.id] = 'present'; });
      setRecords(map);
    }
  }, [students]);

  const handleSave = async () => {
    if (!user) return;
    if (!subjectId) { toast.error('Please select a subject'); return; }
    setSaving(true);
    try {
      const rows = students.map(s => ({
        student_id: s.id,
        class_id: classId,
        subject_id: subjectId,
        date: dateStr,
        status: records[s.id] || 'absent',
        marked_by: user.id,
      }));

      const { error } = await (supabase as any)
        .from('attendance')
        .upsert(rows, { onConflict: 'student_id,class_id,date' });
      if (error) throw error;
      toast.success('Attendance saved successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  const markAll = (status: string) => {
    const map: Record<string, string> = {};
    students.forEach(s => { map[s.id] = status; });
    setRecords(map);
  };

  const presentCount = Object.values(records).filter(v => v === 'present').length;
  const absentCount = Object.values(records).filter(v => v === 'absent').length;
  const lateCount = Object.values(records).filter(v => v === 'late').length;

  if (studentsLoading) {
    return <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-12" />)}</div>;
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1.5">
              <Label>Subject</Label>
              <Select value={subjectId} onValueChange={setSubjectId}>
                <SelectTrigger className="w-48"><SelectValue placeholder="Select subject" /></SelectTrigger>
                <SelectContent>
                  {classSubjects.map(s => (
                    <SelectItem key={s.subject_id} value={s.subject_id}>{s.subject_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className={cn("justify-start text-left font-normal w-44", !date && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(date, 'PPP')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} disabled={(d) => d > new Date()} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex gap-1.5">
              <Button variant="outline" size="sm" onClick={() => markAll('present')}>All Present</Button>
              <Button variant="outline" size="sm" onClick={() => markAll('absent')}>All Absent</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary badges */}
      <div className="flex gap-2">
        <Badge className="bg-green-500/10 text-green-700 border border-green-500/20"><CheckCircle className="h-3 w-3 mr-1" />{presentCount} Present</Badge>
        <Badge className="bg-red-500/10 text-red-700 border border-red-500/20"><XCircle className="h-3 w-3 mr-1" />{absentCount} Absent</Badge>
        <Badge className="bg-yellow-500/10 text-yellow-700 border border-yellow-500/20"><Clock className="h-3 w-3 mr-1" />{lateCount} Late</Badge>
      </div>

      {/* Student list */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Mark Attendance</CardTitle></CardHeader>
        <CardContent>
          {students.length === 0 ? (
            <p className="text-muted-foreground text-center py-6">No students in this class.</p>
          ) : (
            <>
              <div className="space-y-2">
                {loadingRecords ? (
                  [1,2,3].map(i => <Skeleton key={i} className="h-12" />)
                ) : (
                  students.map((student, idx) => (
                    <div key={student.id} className={cn(
                      "flex items-center justify-between p-3 rounded-lg border transition-colors",
                      records[student.id] === 'present' && "bg-green-500/5 border-green-500/20",
                      records[student.id] === 'absent' && "bg-red-500/5 border-red-500/20",
                      records[student.id] === 'late' && "bg-yellow-500/5 border-yellow-500/20",
                    )}>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground w-6 text-center font-mono">{idx + 1}</span>
                        <div>
                          <p className="text-sm font-medium text-foreground">{student.full_name || 'Unnamed'}</p>
                          <p className="text-xs text-muted-foreground">{student.email}</p>
                        </div>
                      </div>
                      <Select
                        value={records[student.id] || 'present'}
                        onValueChange={(v) => setRecords(prev => ({ ...prev, [student.id]: v }))}
                      >
                        <SelectTrigger className="w-28">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="present">✅ Present</SelectItem>
                          <SelectItem value="absent">❌ Absent</SelectItem>
                          <SelectItem value="late">⏰ Late</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ))
                )}
              </div>
              <Button onClick={handleSave} disabled={saving || !subjectId} className="mt-4 w-full sm:w-auto">
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save Attendance
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
