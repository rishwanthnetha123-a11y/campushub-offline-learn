import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useDepartmentSubjects, useDepartmentClasses, useDepartmentFaculty, useDepartmentSchedules } from '@/hooks/use-hod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function CreateSchedule({ departmentId }: { departmentId: string }) {
  const { subjects } = useDepartmentSubjects(departmentId);
  const { classes } = useDepartmentClasses(departmentId);
  const { faculty } = useDepartmentFaculty(departmentId);
  const { schedules, isLoading, refetch } = useDepartmentSchedules(departmentId);

  const [classId, setClassId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [facultyId, setFacultyId] = useState('');
  const [day, setDay] = useState('1');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!classId || !subjectId || !facultyId) {
      toast.error('Please fill all fields');
      return;
    }
    if (startTime >= endTime) {
      toast.error('End time must be after start time');
      return;
    }

    setSaving(true);
    try {
      const { error } = await (supabase as any)
        .from('schedules')
        .insert({
          class_id: classId,
          subject_id: subjectId,
          faculty_id: facultyId,
          day_of_week: parseInt(day),
          start_time: startTime,
          end_time: endTime,
        });

      if (error) {
        if (error.message?.includes('overlap')) {
          toast.error(error.message);
        } else {
          throw error;
        }
      } else {
        toast.success('Schedule slot created');
        refetch();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to create schedule');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await (supabase as any).from('schedules').delete().eq('id', id);
    if (error) toast.error(error.message);
    else { toast.success('Schedule slot deleted'); refetch(); }
  };

  // Group schedules by day
  const byDay = DAYS.map((name, idx) => ({
    name,
    idx,
    slots: schedules.filter(s => s.day_of_week === idx).sort((a, b) => a.start_time.localeCompare(b.start_time)),
  })).filter(d => d.idx >= 1 && d.idx <= 6); // Mon-Sat

  if (isLoading) {
    return <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-12" />)}</div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground">Class Schedule</h2>

      <Card>
        <CardHeader><CardTitle className="text-base">Add Schedule Slot</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Day</Label>
              <Select value={day} onValueChange={setDay}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DAYS.slice(1, 7).map((d, i) => (
                    <SelectItem key={i+1} value={String(i+1)}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Start Time</Label>
              <Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>End Time</Label>
              <Input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
            </div>
          </div>
          <Button onClick={handleCreate} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}
            Add Slot
          </Button>
        </CardContent>
      </Card>

      {/* Weekly timetable view */}
      {byDay.map(d => (
        d.slots.length > 0 && (
          <Card key={d.idx}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">{d.name}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Faculty</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {d.slots.map(s => (
                    <TableRow key={s.id}>
                      <TableCell>
                        <Badge variant="outline">{s.start_time.slice(0,5)} - {s.end_time.slice(0,5)}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">{s.subject_name}</TableCell>
                      <TableCell>{s.faculty_name}</TableCell>
                      <TableCell>{s.class_label}</TableCell>
                      <TableCell>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Slot?</AlertDialogTitle>
                              <AlertDialogDescription>This will remove this schedule slot permanently.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(s.id)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )
      ))}

      {schedules.length === 0 && (
        <Card><CardContent className="py-8 text-center text-muted-foreground">No schedule slots created yet.</CardContent></Card>
      )}
    </div>
  );
}
