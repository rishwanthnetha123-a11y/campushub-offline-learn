import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { useClassStudents } from '@/hooks/use-faculty';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import { CalendarIcon, Save, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface AttendanceRecord {
  student_id: string;
  status: string;
}

export function AttendanceTab({ classId }: { classId: string }) {
  const { user } = useAuthContext();
  const { students, isLoading: studentsLoading } = useClassStudents(classId);
  const [date, setDate] = useState<Date>(new Date());
  const [records, setRecords] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [loadingRecords, setLoadingRecords] = useState(false);

  const dateStr = format(date, 'yyyy-MM-dd');

  // Load existing attendance for date
  useEffect(() => {
    loadAttendance();
  }, [dateStr, classId]);

  const loadAttendance = async () => {
    setLoadingRecords(true);
    const { data } = await (supabase as any)
      .from('attendance')
      .select('student_id, status')
      .eq('class_id', classId)
      .eq('date', dateStr);

    const map: Record<string, string> = {};
    if (data) {
      (data as AttendanceRecord[]).forEach(r => { map[r.student_id] = r.status; });
    }
    // Default unset students to 'present'
    students.forEach(s => {
      if (!map[s.id]) map[s.id] = 'present';
    });
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
    setSaving(true);

    try {
      const rows = students.map(s => ({
        student_id: s.id,
        class_id: classId,
        date: dateStr,
        status: records[s.id] || 'absent',
        marked_by: user.id,
      }));

      // Upsert attendance
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

  if (studentsLoading) {
    return <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-12" />)}</div>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-base">Mark Attendance</CardTitle>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className={cn("justify-start text-left font-normal", !date && "text-muted-foreground")}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              {format(date, 'PPP')}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(d) => d && setDate(d)}
              disabled={(d) => d > new Date()}
              initialFocus
              className="p-3 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </CardHeader>
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
                  <div key={student.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-6">{idx + 1}</span>
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
                        <SelectItem value="present">Present</SelectItem>
                        <SelectItem value="absent">Absent</SelectItem>
                        <SelectItem value="late">Late</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ))
              )}
            </div>
            <Button onClick={handleSave} disabled={saving} className="mt-4 w-full sm:w-auto">
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save Attendance
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
