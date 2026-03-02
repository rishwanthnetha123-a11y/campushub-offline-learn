import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useClassStudents } from '@/hooks/use-faculty';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface StudentAnalytics {
  name: string;
  attendance_pct: number;
  avg_marks: number;
}

export function AnalyticsTab({ classId }: { classId: string }) {
  const { students, isLoading: studentsLoading } = useClassStudents(classId);
  const [analytics, setAnalytics] = useState<StudentAnalytics[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (studentsLoading || students.length === 0) {
      setLoading(false);
      return;
    }
    computeAnalytics();
  }, [students, studentsLoading]);

  const computeAnalytics = async () => {
    setLoading(true);
    const result: StudentAnalytics[] = [];

    for (const s of students) {
      const { data: attData } = await (supabase as any)
        .from('attendance')
        .select('status')
        .eq('student_id', s.id)
        .eq('class_id', classId);

      const total = attData?.length || 0;
      const present = attData?.filter((a: any) => a.status === 'present' || a.status === 'late').length || 0;
      const attPct = total > 0 ? Math.round((present / total) * 100) : 0;

      const { data: marksData } = await (supabase as any)
        .from('marks')
        .select('marks_obtained, max_marks')
        .eq('student_id', s.id)
        .eq('class_id', classId);

      let avgMarks = 0;
      if (marksData && marksData.length > 0) {
        const totalPct = marksData.reduce((sum: number, m: any) => sum + ((m.marks_obtained / m.max_marks) * 100), 0);
        avgMarks = Math.round(totalPct / marksData.length);
      }

      result.push({ name: s.full_name || 'Unknown', attendance_pct: attPct, avg_marks: avgMarks });
    }

    setAnalytics(result);
    setLoading(false);
  };

  if (loading) {
    return <div className="space-y-3">{[1,2].map(i => <Skeleton key={i} className="h-48" />)}</div>;
  }

  const sorted = [...analytics].sort((a, b) => b.avg_marks - a.avg_marks);
  const top5 = sorted.slice(0, 5);
  const defaulters = analytics.filter(s => s.attendance_pct < 75);

  return (
    <div className="space-y-4">
      {/* Attendance chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Attendance Overview</CardTitle>
        </CardHeader>
        <CardContent>
          {analytics.length === 0 ? (
            <p className="text-muted-foreground text-center py-6">No data yet.</p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                  <Tooltip />
                  <Bar dataKey="attendance_pct" name="Attendance %" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Top 5 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top 5 Students</CardTitle>
          </CardHeader>
          <CardContent>
            {top5.length === 0 ? (
              <p className="text-muted-foreground text-sm">No marks data yet.</p>
            ) : (
              <div className="space-y-2">
                {top5.map((s, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="w-6 h-6 flex items-center justify-center rounded-full text-xs p-0">{i + 1}</Badge>
                      <span className="text-sm font-medium">{s.name}</span>
                    </div>
                    <span className="text-sm font-bold text-primary">{s.avg_marks}%</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Defaulters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base text-destructive">Defaulters (&lt;75% Attendance)</CardTitle>
          </CardHeader>
          <CardContent>
            {defaulters.length === 0 ? (
              <p className="text-sm text-muted-foreground">No defaulters 🎉</p>
            ) : (
              <div className="space-y-2">
                {defaulters.map((s, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-destructive/5 border border-destructive/20">
                    <span className="text-sm">{s.name}</span>
                    <Badge variant="destructive">{s.attendance_pct}%</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
