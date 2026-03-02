import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { useFacultyRole, useFacultyClasses } from '@/hooks/use-faculty';
import { FacultyLayout } from '@/components/faculty/FacultyLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Users } from 'lucide-react';
import { AttendanceTab } from '@/components/faculty/AttendanceTab';
import { MarksTab } from '@/components/faculty/MarksTab';
import { StudentsTab } from '@/components/faculty/StudentsTab';
import { AnalyticsTab } from '@/components/faculty/AnalyticsTab';

export default function FacultyClassWorkspacePage() {
  const { classId } = useParams<{ classId: string }>();
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

  const currentClass = classes.find(c => c.class_id === classId);

  if (authLoading || roleLoading || classesLoading) {
    return (
      <FacultyLayout>
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64" />
        </div>
      </FacultyLayout>
    );
  }

  if (!currentClass) {
    return (
      <FacultyLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Class not found or not assigned to you.</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate('/faculty')}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
          </Button>
        </div>
      </FacultyLayout>
    );
  }

  return (
    <FacultyLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/faculty')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground">{currentClass.department_name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary">Year {currentClass.year}</Badge>
              <Badge variant="outline">Section {currentClass.section}</Badge>
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Users className="h-3.5 w-3.5" /> {currentClass.student_count} students
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="attendance" className="w-full">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="marks">Marks</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="attendance" className="mt-4">
            <AttendanceTab classId={classId!} />
          </TabsContent>
          <TabsContent value="marks" className="mt-4">
            <MarksTab classId={classId!} />
          </TabsContent>
          <TabsContent value="students" className="mt-4">
            <StudentsTab classId={classId!} />
          </TabsContent>
          <TabsContent value="analytics" className="mt-4">
            <AnalyticsTab classId={classId!} />
          </TabsContent>
        </Tabs>
      </div>
    </FacultyLayout>
  );
}
