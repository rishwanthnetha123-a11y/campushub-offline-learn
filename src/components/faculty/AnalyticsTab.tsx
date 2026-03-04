import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useClassStudents } from '@/hooks/use-faculty';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, TrendingUp, AlertTriangle } from 'lucide-react';

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
    if (studentsLoading || students.length === 0) { setLoading(false); return; }
    computeAnalytics();
  }, [students, studentsLoading]);

  const computeAnalytics = async () => {
    setLoading(true);
    const result: StudentAnalytics[] = [];

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
  const overallAttendance = analytics.length > 0
    ? Math.round(analytics.reduce((s, a) => s + a.attendance_pct, 0) / analytics.length) : 0;
  const overallMarks = analytics.length > 0
    ? Math.round(analytics.reduce((s, a) => s + a.avg_marks, 0) / analytics.length) : 0;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-5 pb-4 text-center">
            <Users className="h-5 w-5 text-primary mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">Total Students</p>
            <p className="text-xl font-bold text-foreground">{analytics.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4 text-center">
            <TrendingUp className="h-5 w-5 text-primary mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">Avg Attendance</p>
            <p className="text-xl font-bold text-foreground">{overallAttendance}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4 text-center">
            <AlertTriangle className="h-5 w-5 text-destructive mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">Defaulters</p>
            <p className="text-xl font-bold text-destructive">{defaulters.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Attendance chart */}
      {analytics.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Attendance Overview</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} className="fill-muted-foreground" angle={-45} textAnchor="end" height={60} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                  <Tooltip />
                  <Bar dataKey="attendance_pct" name="Attendance %" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="avg_marks" name="Avg Marks %" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Top 5 */}
        <Card>
          <CardHeader><CardTitle className="text-base">🏆 Top 5 Students</CardTitle></CardHeader>
          <CardContent>
            {top5.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">No marks data yet.</p>
            ) : (
              <div className="space-y-3">
                {top5.map((s, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Badge variant="secondary" className="w-6 h-6 flex items-center justify-center rounded-full text-xs p-0 shrink-0">{i + 1}</Badge>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{s.name}</p>
                      <Progress value={s.avg_marks} className="h-1.5 mt-1" />
                    </div>
                    <span className="text-sm font-bold text-primary shrink-0">{s.avg_marks}%</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Defaulters */}
        <Card>
          <CardHeader><CardTitle className="text-base text-destructive">⚠️ Defaulters (&lt;75%)</CardTitle></CardHeader>
          <CardContent>
            {defaulters.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No defaulters 🎉</p>
            ) : (
              <div className="space-y-2">
                {defaulters.sort((a, b) => a.attendance_pct - b.attendance_pct).map((s, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-destructive/5 border border-destructive/20">
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
