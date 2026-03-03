import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useDepartmentClasses, useDepartmentFaculty } from '@/hooks/use-hod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, BookOpen, GraduationCap, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ClassStat {
  label: string;
  class_id: string;
  student_count: number;
  attendance_pct: number;
}

export function DepartmentAnalytics({ departmentId }: { departmentId: string }) {
  const { classes, isLoading: classesLoading } = useDepartmentClasses(departmentId);
  const { faculty, isLoading: facultyLoading } = useDepartmentFaculty(departmentId);
  const [classStats, setClassStats] = useState<ClassStat[]>([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [defaulters, setDefaulters] = useState<{ name: string; pct: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (classesLoading || classes.length === 0) { setLoading(false); return; }
    compute();
  }, [classes, classesLoading]);

  const compute = async () => {
    setLoading(true);
    const stats: ClassStat[] = [];
    let total = 0;
    const allDefaulters: { name: string; pct: number }[] = [];

    for (const cls of classes) {
      const { data: students } = await (supabase as any)
        .from('profiles')
        .select('id, full_name')
        .eq('class_id', cls.id);

      const count = students?.length || 0;
      total += count;

      // Per-class attendance
      const { data: attData } = await (supabase as any)
        .from('attendance')
        .select('student_id, status')
        .eq('class_id', cls.id);

      let totalAtt = attData?.length || 0;
      let presentCount = attData?.filter((a: any) => a.status === 'present' || a.status === 'late').length || 0;
      let classPct = totalAtt > 0 ? Math.round((presentCount / totalAtt) * 100) : 0;

      stats.push({
        label: `Y${cls.year}-${cls.section}`,
        class_id: cls.id,
        student_count: count,
        attendance_pct: classPct,
      });

      // Per-student defaulters
      if (students) {
        for (const s of students) {
          const studentAtt = attData?.filter((a: any) => a.student_id === s.id) || [];
          const sTotal = studentAtt.length;
          const sPresent = studentAtt.filter((a: any) => a.status === 'present' || a.status === 'late').length;
          const pct = sTotal > 0 ? Math.round((sPresent / sTotal) * 100) : 100;
          if (pct < 75 && sTotal > 0) {
            allDefaulters.push({ name: s.full_name || 'Unknown', pct });
          }
        }
      }
    }

    setClassStats(stats);
    setTotalStudents(total);
    setDefaulters(allDefaulters.sort((a, b) => a.pct - b.pct));
    setLoading(false);
  };

  if (loading || classesLoading || facultyLoading) {
    return <div className="space-y-3">{[1,2,3,4].map(i => <Skeleton key={i} className="h-24" />)}</div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground">Department Analytics</h2>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard icon={Users} label="Faculty" value={faculty.length} />
        <SummaryCard icon={BookOpen} label="Classes" value={classes.length} />
        <SummaryCard icon={GraduationCap} label="Students" value={totalStudents} />
        <SummaryCard icon={BarChart3} label="Avg Attendance" value={
          classStats.length > 0
            ? `${Math.round(classStats.reduce((s, c) => s + c.attendance_pct, 0) / classStats.length)}%`
            : '—'
        } />
      </div>

      {/* Attendance by class chart */}
      {classStats.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Attendance by Class</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={classStats}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                  <Tooltip />
                  <Bar dataKey="attendance_pct" name="Attendance %" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Defaulters */}
      <Card>
        <CardHeader><CardTitle className="text-base text-destructive">Defaulters (&lt;75% Attendance)</CardTitle></CardHeader>
        <CardContent>
          {defaulters.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No defaulters 🎉</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {defaulters.map((d, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-destructive/5 border border-destructive/20">
                  <span className="text-sm">{d.name}</span>
                  <Badge variant="destructive">{d.pct}%</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value }: { icon: any; label: string; value: string | number }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-xl font-bold text-foreground">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
