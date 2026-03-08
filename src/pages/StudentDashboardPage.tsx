import { useEffect, useState } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CalendarDays, BookOpen, BarChart3, Clock, CheckCircle2, XCircle, AlertCircle, Building2, Users, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface AttendanceRecord {
  id: string;
  date: string;
  status: string;
  subject_id: string | null;
  subjects?: { subject_name: string; subject_code: string } | null;
  profiles?: { full_name: string | null } | null; // marked_by faculty
}

interface MarkRecord {
  id: string;
  subject: string;
  exam_type: string;
  marks_obtained: number;
  max_marks: number;
  subject_id: string | null;
  subjects?: { subject_name: string; subject_code: string } | null;
  entered_by_profile?: { full_name: string | null } | null;
}

interface ScheduleRecord {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  subjects: { subject_name: string; subject_code: string };
  profiles: { full_name: string | null };
}

interface ClassInfo {
  year: number;
  section: string;
  departments: { name: string } | null;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const StudentDashboardPage = () => {
  const { user, isLoading: authLoading } = useAuthContext();
  const navigate = useNavigate();
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [marks, setMarks] = useState<MarkRecord[]>([]);
  const [schedule, setSchedule] = useState<ScheduleRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
  const [hasClass, setHasClass] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;

    const fetchAll = async () => {
      setLoading(true);

      // Get profile with class info
      const { data: prof } = await supabase
        .from('profiles')
        .select('class_id, department_id')
        .eq('id', user.id)
        .single();

      if (!prof?.class_id) {
        setHasClass(false);
        setLoading(false);
        return;
      }

      // Fetch class + department info
      const { data: cls } = await supabase
        .from('classes')
        .select('year, section, departments(name)')
        .eq('id', prof.class_id)
        .single();
      setClassInfo(cls as any);

      // Fetch attendance with faculty who marked it
      const { data: att } = await supabase
        .from('attendance')
        .select('id, date, status, subject_id, subjects(subject_name, subject_code), profiles!attendance_marked_by_fkey(full_name)')
        .eq('student_id', user.id)
        .order('date', { ascending: false });
      setAttendance((att as any) || []);

      // Fetch marks with faculty who entered them
      const { data: mrk } = await supabase
        .from('marks')
        .select('id, subject, exam_type, marks_obtained, max_marks, subject_id, subjects(subject_name, subject_code), profiles!marks_entered_by_fkey(full_name)')
        .eq('student_id', user.id)
        .order('created_at', { ascending: false });
      // Map the profiles relation to entered_by_profile for clarity
      const mappedMarks = ((mrk as any) || []).map((m: any) => ({
        ...m,
        entered_by_profile: m.profiles,
      }));
      setMarks(mappedMarks);

      // Fetch schedule for student's class
      const { data: sch } = await supabase
        .from('schedules')
        .select('id, day_of_week, start_time, end_time, subjects(subject_name, subject_code), profiles(full_name)')
        .eq('class_id', prof.class_id)
        .order('day_of_week')
        .order('start_time');
      setSchedule((sch as any) || []);

      setLoading(false);
    };

    fetchAll();
  }, [user]);

  if (authLoading || !user) return null;

  // Not assigned to a class
  if (!hasClass && !loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-2xl font-bold text-foreground">My Academics</h1>
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            You are not assigned to a class yet. Please contact your HOD or admin to get assigned to a department and class before you can view your academic records.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Attendance stats
  const totalClasses = attendance.length;
  const presentCount = attendance.filter(a => a.status === 'present').length;
  const lateCount = attendance.filter(a => a.status === 'late').length;
  const attendancePercent = totalClasses > 0 ? Math.round(((presentCount + lateCount) / totalClasses) * 100) : 0;

  // Marks stats
  const avgPercent = marks.length > 0
    ? Math.round(marks.reduce((s, m) => s + (m.marks_obtained / m.max_marks) * 100, 0) / marks.length)
    : 0;

  // Group marks by subject
  const marksBySubject = marks.reduce<Record<string, MarkRecord[]>>((acc, m) => {
    const key = m.subjects?.subject_name || m.subject;
    if (!acc[key]) acc[key] = [];
    acc[key].push(m);
    return acc;
  }, {});

  // Group attendance by subject for summary
  const attendanceBySubject = attendance.reduce<Record<string, { total: number; present: number }>>((acc, a) => {
    const key = a.subjects?.subject_name || 'General';
    if (!acc[key]) acc[key] = { total: 0, present: 0 };
    acc[key].total++;
    if (a.status === 'present' || a.status === 'late') acc[key].present++;
    return acc;
  }, {});

  // Group schedule by day
  const scheduleByDay = schedule.reduce<Record<number, ScheduleRecord[]>>((acc, s) => {
    if (!acc[s.day_of_week]) acc[s.day_of_week] = [];
    acc[s.day_of_week].push(s);
    return acc;
  }, {});

  const statusIcon = (status: string) => {
    if (status === 'present') return <CheckCircle2 className="h-4 w-4 text-primary" />;
    if (status === 'late') return <AlertCircle className="h-4 w-4 text-accent" />;
    return <XCircle className="h-4 w-4 text-destructive" />;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header with class info */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Academics</h1>
          <p className="text-muted-foreground text-sm">Records entered by your assigned faculty</p>
        </div>
        {classInfo && (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1.5 py-1">
              <Building2 className="h-3.5 w-3.5" />
              {classInfo.departments?.name || 'Department'}
            </Badge>
            <Badge variant="secondary" className="gap-1.5 py-1">
              <Users className="h-3.5 w-3.5" />
              Year {classInfo.year} – Sec {classInfo.section}
            </Badge>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <CalendarDays className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Attendance</p>
              {loading ? <Skeleton className="h-7 w-16" /> : (
                <p className="text-2xl font-bold text-foreground">{attendancePercent}%</p>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-accent/10">
              <BarChart3 className="h-6 w-6 text-accent" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg. Marks</p>
              {loading ? <Skeleton className="h-7 w-16" /> : (
                <p className="text-2xl font-bold text-foreground">{avgPercent}%</p>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-muted">
              <BookOpen className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Subjects</p>
              {loading ? <Skeleton className="h-7 w-16" /> : (
                <p className="text-2xl font-bold text-foreground">{Object.keys(marksBySubject).length || '—'}</p>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-muted">
              <Clock className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Classes/Week</p>
              {loading ? <Skeleton className="h-7 w-16" /> : (
                <p className="text-2xl font-bold text-foreground">{schedule.length || '—'}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="schedule" className="space-y-4">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="schedule" className="gap-1.5"><Clock className="h-4 w-4" />Schedule</TabsTrigger>
          <TabsTrigger value="attendance" className="gap-1.5"><CalendarDays className="h-4 w-4" />Attendance</TabsTrigger>
          <TabsTrigger value="marks" className="gap-1.5"><BarChart3 className="h-4 w-4" />Marks</TabsTrigger>
        </TabsList>

        {/* Schedule Tab */}
        <TabsContent value="schedule">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Weekly Timetable</CardTitle>
              <CardDescription>Schedule set by your HOD — showing assigned faculty for each period</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
              ) : schedule.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No schedule found. Your HOD will set up the class timetable.</p>
              ) : (
                <div className="space-y-6">
                  {[1, 2, 3, 4, 5, 6].filter(d => scheduleByDay[d]).map(day => (
                    <div key={day}>
                      <h3 className="font-semibold text-foreground mb-2">{DAYS[day]}</h3>
                      <div className="space-y-2">
                        {scheduleByDay[day].map(s => (
                          <div key={s.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
                            <div className="flex items-center gap-3">
                              <div className="text-sm font-mono text-muted-foreground w-[100px]">
                                {s.start_time.slice(0, 5)} – {s.end_time.slice(0, 5)}
                              </div>
                              <div>
                                <p className="font-medium text-foreground">{s.subjects.subject_name}</p>
                                <p className="text-xs text-muted-foreground">{s.subjects.subject_code}</p>
                              </div>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              Faculty: {s.profiles.full_name || 'TBA'}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Attendance Tab */}
        <TabsContent value="attendance">
          <div className="space-y-4">
            {/* Subject-wise summary */}
            {Object.keys(attendanceBySubject).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Subject-wise Attendance</CardTitle>
                  <CardDescription>Attendance marked by your faculty per subject</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {Object.entries(attendanceBySubject).map(([subj, { total, present }]) => {
                    const pct = Math.round((present / total) * 100);
                    return (
                      <div key={subj} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-foreground">{subj}</span>
                          <span className={cn("font-medium", pct >= 75 ? "text-primary" : "text-destructive")}>
                            {pct}% ({present}/{total})
                          </span>
                        </div>
                        <Progress value={pct} className="h-2" />
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            {/* Detailed records */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Attendance Records</CardTitle>
                <CardDescription>
                  {totalClasses > 0 ? `${presentCount} present, ${lateCount} late out of ${totalClasses} classes` : 'No records yet — faculty will mark your attendance'}
                </CardDescription>
                {totalClasses > 0 && <Progress value={attendancePercent} className="h-2 mt-2" />}
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
                ) : attendance.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No attendance records yet. Your faculty will mark attendance for each class.</p>
                ) : (
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {attendance.map(a => (
                      <div key={a.id} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex items-center gap-3">
                          {statusIcon(a.status)}
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {a.subjects?.subject_name || 'General'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(a.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                              {a.profiles?.full_name && ` · by ${a.profiles.full_name}`}
                            </p>
                          </div>
                        </div>
                        <Badge variant={a.status === 'present' ? 'default' : a.status === 'late' ? 'secondary' : 'destructive'} className="capitalize text-xs">
                          {a.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Marks Tab */}
        <TabsContent value="marks">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Marks & Performance</CardTitle>
              <CardDescription>Exam scores entered by your assigned faculty</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
              ) : marks.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No marks recorded yet. Your faculty will enter marks after exams.</p>
              ) : (
                <div className="space-y-6">
                  {Object.entries(marksBySubject).map(([subjectName, records]) => {
                    const avg = Math.round(records.reduce((s, m) => s + (m.marks_obtained / m.max_marks) * 100, 0) / records.length);
                    const faculty = records[0]?.entered_by_profile?.full_name;
                    return (
                      <div key={subjectName} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-foreground">{subjectName}</h3>
                            {faculty && <p className="text-xs text-muted-foreground">Faculty: {faculty}</p>}
                          </div>
                          <span className={cn("text-sm font-medium", avg >= 60 ? "text-primary" : avg >= 40 ? "text-accent" : "text-destructive")}>
                            Avg: {avg}%
                          </span>
                        </div>
                        <Progress value={avg} className="h-2" />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                          {records.map(m => (
                            <div key={m.id} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50 border text-sm">
                              <span className="capitalize text-muted-foreground">{m.exam_type}</span>
                              <span className="font-medium text-foreground">{m.marks_obtained}/{m.max_marks}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StudentDashboardPage;
