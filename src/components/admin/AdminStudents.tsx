import { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  TrendingUp, 
  Download, 
  Trophy,
  Video,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { supabase } from '@/lib/supabase';
import type { Tables } from '@/integrations/supabase/types';

type Profile = Tables<'profiles'>;
type StudentProgressRow = Tables<'student_progress'>;
type QuizAttemptRow = Tables<'quiz_attempts'>;
type UserDownloadRow = Tables<'user_downloads'>;

interface StudentWithStats extends Profile {
  totalProgress: number;
  videosCompleted: number;
  quizzesPassed: number;
  averageQuizScore: number;
  totalDownloads: number;
}

export function AdminStudents() {
  const [students, setStudents] = useState<StudentWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);
  const [studentDetails, setStudentDetails] = useState<{
    progress: StudentProgress[];
    quizzes: QuizAttempt[];
    downloads: UserDownload[];
  } | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      // Get all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Get aggregated stats for each student
      const studentsWithStats: StudentWithStats[] = await Promise.all(
        (profiles || []).map(async (profile) => {
          const [progressRes, quizzesRes, downloadsRes] = await Promise.all([
            supabase
              .from('student_progress')
              .select('*')
              .eq('user_id', profile.id),
            supabase
              .from('quiz_attempts')
              .select('*')
              .eq('user_id', profile.id),
            supabase
              .from('user_downloads')
              .select('*')
              .eq('user_id', profile.id),
          ]);

          const progressData = progressRes.data || [];
          const quizData = quizzesRes.data || [];
          const downloadData = downloadsRes.data || [];

          const videosCompleted = progressData.filter(p => p.completed && p.content_type === 'video').length;
          const quizzesPassed = quizData.filter(q => q.passed).length;
          const averageQuizScore = quizData.length > 0 
            ? Math.round(quizData.reduce((sum, q) => sum + q.score, 0) / quizData.length)
            : 0;
          const totalProgress = progressData.length > 0
            ? Math.round(progressData.reduce((sum, p) => sum + p.progress, 0) / progressData.length)
            : 0;

          return {
            ...profile,
            totalProgress,
            videosCompleted,
            quizzesPassed,
            averageQuizScore,
            totalDownloads: downloadData.length,
          };
        })
      );

      setStudents(studentsWithStats);
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentDetails = async (studentId: string) => {
    setDetailsLoading(true);
    try {
      const [progressRes, quizzesRes, downloadsRes] = await Promise.all([
        supabase
          .from('student_progress')
          .select('*')
          .eq('user_id', studentId)
          .order('updated_at', { ascending: false }),
        supabase
          .from('quiz_attempts')
          .select('*')
          .eq('user_id', studentId)
          .order('completed_at', { ascending: false }),
        supabase
          .from('user_downloads')
          .select('*')
          .eq('user_id', studentId)
          .order('downloaded_at', { ascending: false }),
      ]);

      setStudentDetails({
        progress: progressRes.data || [],
        quizzes: quizzesRes.data || [],
        downloads: downloadsRes.data || [],
      });
    } catch (error) {
      console.error('Error fetching student details:', error);
    } finally {
      setDetailsLoading(false);
    }
  };

  const toggleStudentDetails = (studentId: string) => {
    if (expandedStudent === studentId) {
      setExpandedStudent(null);
      setStudentDetails(null);
    } else {
      setExpandedStudent(studentId);
      fetchStudentDetails(studentId);
    }
  };

  const filteredStudents = students.filter(student =>
    student.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Leaderboard - top 5 by quiz score
  const leaderboard = [...students]
    .sort((a, b) => b.averageQuizScore - a.averageQuizScore)
    .slice(0, 5);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-accent" />
            Student Leaderboard
          </CardTitle>
          <CardDescription>Top performing students by quiz score</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {leaderboard.map((student, index) => (
              <div 
                key={student.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <span className={`font-bold text-lg ${
                    index === 0 ? 'text-amber-500' : 
                    index === 1 ? 'text-slate-400' : 
                    index === 2 ? 'text-amber-700' : 'text-muted-foreground'
                  }`}>
                    #{index + 1}
                  </span>
                  <div>
                    <p className="font-medium">{student.full_name || 'Unknown'}</p>
                    <p className="text-sm text-muted-foreground">{student.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary">{student.averageQuizScore}%</p>
                  <p className="text-xs text-muted-foreground">
                    {student.quizzesPassed} quizzes passed
                  </p>
                </div>
              </div>
            ))}
            {leaderboard.length === 0 && (
              <p className="text-center text-muted-foreground py-4">
                No quiz data available yet
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Student List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            All Students
          </CardTitle>
          <CardDescription>
            {students.length} total students enrolled
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search students..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            {filteredStudents.map((student) => (
              <Collapsible
                key={student.id}
                open={expandedStudent === student.id}
                onOpenChange={() => toggleStudentDetails(student.id)}
              >
                <div className="border rounded-lg">
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-between p-4 h-auto"
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-left">
                          <p className="font-medium">{student.full_name || 'Unknown'}</p>
                          <p className="text-sm text-muted-foreground">{student.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="hidden sm:flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <Video className="h-4 w-4 text-primary" />
                            <span>{student.videosCompleted}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <BookOpen className="h-4 w-4 text-success" />
                            <span>{student.quizzesPassed}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Download className="h-4 w-4 text-accent" />
                            <span>{student.totalDownloads}</span>
                          </div>
                        </div>
                        <div className="w-24 hidden md:block">
                          <Progress value={student.totalProgress} className="h-2" />
                        </div>
                        {expandedStudent === student.id ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </Button>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <div className="px-4 pb-4 space-y-4 border-t">
                      {detailsLoading ? (
                        <div className="flex justify-center py-4">
                          <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                      ) : studentDetails ? (
                        <>
                          {/* Video Progress */}
                          <div className="mt-4">
                            <h4 className="font-medium mb-2 flex items-center gap-2">
                              <Video className="h-4 w-4" />
                              Video Progress ({studentDetails.progress.filter(p => p.content_type === 'video').length})
                            </h4>
                            <div className="grid gap-2">
                              {studentDetails.progress
                                .filter(p => p.content_type === 'video')
                                .slice(0, 5)
                                .map((p) => (
                                  <div key={p.id} className="flex items-center justify-between text-sm bg-muted/50 p-2 rounded">
                                    <span className="truncate">{p.content_id}</span>
                                    <div className="flex items-center gap-2">
                                      <Progress value={p.progress} className="w-20 h-2" />
                                      <span className="w-12 text-right">{p.progress}%</span>
                                      {p.completed && (
                                        <Badge variant="outline" className="text-success border-success">
                                          Done
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                ))}
                            </div>
                          </div>

                          {/* Quiz Attempts */}
                          <div>
                            <h4 className="font-medium mb-2 flex items-center gap-2">
                              <BookOpen className="h-4 w-4" />
                              Quiz Attempts ({studentDetails.quizzes.length})
                            </h4>
                            <div className="grid gap-2">
                              {studentDetails.quizzes.slice(0, 5).map((q) => (
                                <div key={q.id} className="flex items-center justify-between text-sm bg-muted/50 p-2 rounded">
                                  <span className="truncate">{q.quiz_id}</span>
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">{q.score}%</span>
                                    <Badge variant={q.passed ? "default" : "destructive"}>
                                      {q.passed ? 'Passed' : 'Failed'}
                                    </Badge>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Downloads */}
                          <div>
                            <h4 className="font-medium mb-2 flex items-center gap-2">
                              <Download className="h-4 w-4" />
                              Downloads ({studentDetails.downloads.length})
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {studentDetails.downloads.slice(0, 10).map((d) => (
                                <Badge key={d.id} variant="outline">
                                  {d.content_id} ({d.content_type})
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </>
                      ) : null}
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            ))}

            {filteredStudents.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No students found
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
