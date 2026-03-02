import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { useFacultyRole, useFacultyClasses } from '@/hooks/use-faculty';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen, Users, CalendarCheck, FileEdit } from 'lucide-react';
import { FacultyLayout } from '@/components/faculty/FacultyLayout';

export default function FacultyDashboardPage() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuthContext();
  const { isFaculty, isLoading: roleLoading } = useFacultyRole();
  const { classes, isLoading: classesLoading } = useFacultyClasses();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth?redirect=/faculty');
      return;
    }
    if (!authLoading && !roleLoading && !isFaculty) {
      navigate('/');
    }
  }, [authLoading, roleLoading, isFaculty, user, navigate]);

  if (authLoading || roleLoading) {
    return (
      <FacultyLayout>
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-28" />)}
          </div>
        </div>
      </FacultyLayout>
    );
  }

  if (!isFaculty) return null;

  const totalStudents = classes.reduce((sum, c) => sum + c.student_count, 0);

  return (
    <FacultyLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Faculty Dashboard</h1>
          <p className="text-muted-foreground">Manage your classes, attendance & marks</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard icon={BookOpen} label="Assigned Classes" value={classes.length} loading={classesLoading} />
          <SummaryCard icon={Users} label="Total Students" value={totalStudents} loading={classesLoading} />
          <SummaryCard icon={CalendarCheck} label="Today's Attendance" value="—" loading={false} />
          <SummaryCard icon={FileEdit} label="Pending Marks" value="—" loading={false} />
        </div>

        {/* Assigned Classes */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-3">Assigned Classes</h2>
          {classesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1,2,3].map(i => <Skeleton key={i} className="h-36" />)}
            </div>
          ) : classes.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No classes assigned yet. Contact your administrator.</CardContent></Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {classes.map(cls => (
                <Card
                  key={cls.class_id}
                  className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-primary"
                  onClick={() => navigate(`/faculty/class/${cls.class_id}`)}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{cls.department_name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">Year {cls.year}</Badge>
                      <Badge variant="outline">Section {cls.section}</Badge>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      {cls.student_count} students
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </FacultyLayout>
  );
}

function SummaryCard({ icon: Icon, label, value, loading }: { icon: any; label: string; value: string | number; loading: boolean }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            {loading ? <Skeleton className="h-6 w-12 mt-1" /> : <p className="text-xl font-bold text-foreground">{value}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
