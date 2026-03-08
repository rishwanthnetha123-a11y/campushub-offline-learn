import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { useHodDepartment, useDepartmentClasses, useDepartmentFaculty, useDepartmentSubjects } from '@/hooks/use-hod';
import { HodLayout } from '@/components/hod/HodLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Building2, Users, BookOpen, GraduationCap, Calendar, BarChart3 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function HodDashboardPage() {
  const navigate = useNavigate();
  const { user, isHod, isLoading: authLoading } = useAuthContext();
  const { departmentId, departmentName, isLoading: deptLoading } = useHodDepartment();
  const { classes, isLoading: classesLoading } = useDepartmentClasses(departmentId);
  const { faculty, isLoading: facultyLoading } = useDepartmentFaculty(departmentId);
  const { subjects, isLoading: subjectsLoading } = useDepartmentSubjects(departmentId);
  const [totalStudents, setTotalStudents] = useState(0);
  const [avgAttendance, setAvgAttendance] = useState<number | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) { navigate('/auth?redirect=/hod'); return; }
    if (!authLoading && !isHod) navigate('/');
  }, [authLoading, isHod, user, navigate]);

  useEffect(() => {
    if (classesLoading || !classes.length) { setStatsLoading(false); return; }
    const compute = async () => {
      setStatsLoading(true);
      let total = 0;
      let totalAtt = 0, presentAtt = 0;
      for (const cls of classes) {
        const { count } = await (supabase as any).from('profiles').select('id', { count: 'exact', head: true }).eq('class_id', cls.id);
        total += count || 0;
        const { data: att } = await (supabase as any).from('attendance').select('status').eq('class_id', cls.id);
        if (att) {
          totalAtt += att.length;
          presentAtt += att.filter((a: any) => a.status === 'present' || a.status === 'late').length;
        }
      }
      setTotalStudents(total);
      setAvgAttendance(totalAtt > 0 ? Math.round((presentAtt / totalAtt) * 100) : null);
      setStatsLoading(false);
    };
    compute();
  }, [classes, classesLoading]);

  const isReady = !authLoading && !deptLoading;

  if (!isReady) {
    return <HodLayout><div className="space-y-4"><Skeleton className="h-8 w-64" /><div className="grid grid-cols-2 md:grid-cols-4 gap-4">{[1,2,3,4].map(i => <Skeleton key={i} className="h-28" />)}</div></div></HodLayout>;
  }
  if (!isHod) return null;

  const summaryCards = [
    { icon: Users, label: 'Faculty', value: faculty.length, loading: facultyLoading },
    { icon: GraduationCap, label: 'Students', value: totalStudents, loading: statsLoading },
    { icon: BookOpen, label: 'Subjects', value: subjects.length, loading: subjectsLoading },
    { icon: Calendar, label: 'Classes', value: classes.length, loading: classesLoading },
  ];

  return (
    <HodLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">HOD Dashboard</h1>
          <div className="flex items-center gap-2 mt-1">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <Badge variant="secondary">{departmentName || 'No department'}</Badge>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {summaryCards.map(({ icon: Icon, label, value, loading }) => (
            <Card key={label}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10"><Icon className="h-5 w-5 text-primary" /></div>
                  <div>
                    <p className="text-sm text-muted-foreground">{label}</p>
                    {loading ? <Skeleton className="h-6 w-12 mt-1" /> : <p className="text-xl font-bold text-foreground">{value}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Attendance Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Department Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-muted/50 text-center">
                <p className="text-sm text-muted-foreground">Avg Attendance</p>
                <p className="text-2xl font-bold text-foreground">{avgAttendance !== null ? `${avgAttendance}%` : '—'}</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50 text-center">
                <p className="text-sm text-muted-foreground">Active Subjects</p>
                <p className="text-2xl font-bold text-foreground">{subjects.length}</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50 text-center">
                <p className="text-sm text-muted-foreground">Total Classes</p>
                <p className="text-2xl font-bold text-foreground">{classes.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Access Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Manage Subjects', desc: 'Create and edit subjects', path: '/hod/subjects', icon: BookOpen },
            { label: 'Assign Faculty', desc: 'Map faculty to subjects', path: '/hod/assign-faculty', icon: Users },
            { label: 'Manage Students', desc: 'Assign students to classes', path: '/hod/students', icon: GraduationCap },
            { label: 'Create Schedule', desc: 'Build weekly timetable', path: '/hod/schedule', icon: Calendar },
            { label: 'Analytics', desc: 'View department stats', path: '/hod/analytics', icon: BarChart3 },
          ].map(item => (
            <Card key={item.path} className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-primary" onClick={() => navigate(item.path)}>
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10"><item.icon className="h-4 w-4 text-primary" /></div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </HodLayout>
  );
}
