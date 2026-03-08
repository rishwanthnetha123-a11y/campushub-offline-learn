import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useClassStudents } from '@/hooks/use-faculty';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';

interface StudentStat {
  id: string;
  full_name: string | null;
  email: string | null;
  roll_no: string | null;
  phone: string | null;
  attendance_pct: number;
  avg_marks: number;
}

export function StudentsTab({ classId }: { classId: string }) {
  const { students, isLoading: studentsLoading } = useClassStudents(classId);
  const [stats, setStats] = useState<StudentStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (studentsLoading || students.length === 0) { setLoading(false); return; }
    computeStats();
  }, [students, studentsLoading]);

  const computeStats = async () => {
    setLoading(true);
    const result: StudentStat[] = [];

    for (const s of students) {
      const [attRes, marksRes] = await Promise.all([
        (supabase as any).from('attendance').select('status').eq('student_id', s.id).eq('class_id', classId),
        (supabase as any).from('marks').select('marks_obtained, max_marks').eq('student_id', s.id).eq('class_id', classId),
      ]);

      const attData = attRes.data || [];
      const total = attData.length;
      const present = attData.filter((a: any) => a.status === 'present' || a.status === 'late').length;
      const attPct = total > 0 ? Math.round((present / total) * 100) : 0;

      const marksData = marksRes.data || [];
      let avgMarks = 0;
      if (marksData.length > 0) {
        const totalPct = marksData.reduce((sum: number, m: any) => sum + ((m.marks_obtained / m.max_marks) * 100), 0);
        avgMarks = Math.round(totalPct / marksData.length);
      }

      result.push({ id: s.id, full_name: s.full_name, email: s.email, roll_no: (s as any).roll_no || null, phone: (s as any).phone || null, attendance_pct: attPct, avg_marks: avgMarks });
    }

    setStats(result);
    setLoading(false);
  };

  if (studentsLoading || loading) {
    return <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-10" />)}</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Students ({stats.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {stats.length === 0 ? (
          <p className="text-muted-foreground text-center py-6">No students in this class.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">#</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Roll No</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Attendance</TableHead>
                  <TableHead>Avg Marks</TableHead>
                  <TableHead className="w-20">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.map((s, idx) => (
                  <TableRow key={s.id}>
                    <TableCell className="text-muted-foreground font-mono text-xs">{idx + 1}</TableCell>
                    <TableCell>
                      <p className="font-medium text-sm">{s.full_name || '—'}</p>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm">{s.roll_no || '—'}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{s.phone || '—'}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={s.attendance_pct} className="h-2 w-20" />
                        <span className={`text-xs font-medium ${s.attendance_pct < 75 ? 'text-destructive' : 'text-foreground'}`}>
                          {s.attendance_pct}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={s.avg_marks} className="h-2 w-20" />
                        <span className="text-xs font-medium">{s.avg_marks}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {s.attendance_pct < 75 ? (
                        <Badge variant="destructive" className="text-xs">Defaulter</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">OK</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
