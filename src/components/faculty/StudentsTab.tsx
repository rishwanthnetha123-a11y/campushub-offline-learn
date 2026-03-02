import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useClassStudents } from '@/hooks/use-faculty';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface StudentStat {
  id: string;
  full_name: string | null;
  email: string | null;
  attendance_pct: number;
  avg_marks: number;
}

export function StudentsTab({ classId }: { classId: string }) {
  const { students, isLoading: studentsLoading } = useClassStudents(classId);
  const [stats, setStats] = useState<StudentStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (studentsLoading || students.length === 0) return;
    computeStats();
  }, [students, studentsLoading]);

  const computeStats = async () => {
    setLoading(true);
    const result: StudentStat[] = [];

    for (const s of students) {
      // Attendance %
      const { data: attData } = await (supabase as any)
        .from('attendance')
        .select('status')
        .eq('student_id', s.id)
        .eq('class_id', classId);

      const total = attData?.length || 0;
      const present = attData?.filter((a: any) => a.status === 'present' || a.status === 'late').length || 0;
      const attPct = total > 0 ? Math.round((present / total) * 100) : 0;

      // Average marks
      const { data: marksData } = await (supabase as any)
        .from('marks')
        .select('marks_obtained, max_marks')
        .eq('student_id', s.id)
        .eq('class_id', classId);

      let avgMarks = 0;
      if (marksData && marksData.length > 0) {
        const totalPct = marksData.reduce((sum: number, m: any) => {
          return sum + ((m.marks_obtained / m.max_marks) * 100);
        }, 0);
        avgMarks = Math.round(totalPct / marksData.length);
      }

      result.push({ id: s.id, full_name: s.full_name, email: s.email, attendance_pct: attPct, avg_marks: avgMarks });
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
        <CardTitle className="text-base">Students</CardTitle>
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
                  <TableHead>Email</TableHead>
                  <TableHead className="text-right">Attendance %</TableHead>
                  <TableHead className="text-right">Avg Marks %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.map((s, idx) => (
                  <TableRow key={s.id}>
                    <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                    <TableCell className="font-medium">{s.full_name || '—'}</TableCell>
                    <TableCell className="text-muted-foreground">{s.email || '—'}</TableCell>
                    <TableCell className={`text-right font-medium ${s.attendance_pct < 75 ? 'text-destructive' : 'text-foreground'}`}>
                      {s.attendance_pct}%
                    </TableCell>
                    <TableCell className="text-right font-medium">{s.avg_marks}%</TableCell>
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
