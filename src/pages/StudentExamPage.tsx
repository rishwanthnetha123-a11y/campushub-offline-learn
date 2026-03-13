import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { FileText, Clock, CheckCircle2, AlertCircle, ArrowLeft, Send } from 'lucide-react';

interface Question {
  id: string;
  type: 'mcq' | 'written';
  question: string;
  options?: string[];
  marks: number;
}

interface Exam {
  id: string;
  title: string;
  description: string | null;
  duration_minutes: number;
  total_marks: number;
  questions: Question[];
}

interface Submission {
  id: string;
  exam_id: string;
  answers: any[];
  total_marks_obtained: number | null;
  is_graded: boolean;
  grades: any[];
}

export default function StudentExamPage() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuthContext();
  const { toast } = useToast();
  const [exams, setExams] = useState<Exam[]>([]);
  const [submissions, setSubmissions] = useState<Record<string, Submission>>({});
  const [loading, setLoading] = useState(true);
  const [activeExam, setActiveExam] = useState<Exam | null>(null);
  const [answers, setAnswers] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [viewingResult, setViewingResult] = useState<{ exam: Exam; sub: Submission } | null>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
    if (user) fetchData();
  }, [user, authLoading]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    const { data: examData } = await (supabase as any)
      .from('exams')
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: false });

    if (examData) setExams(examData.map((e: any) => ({ ...e, questions: e.questions || [] })));

    const { data: subData } = await (supabase as any)
      .from('exam_submissions')
      .select('*')
      .eq('student_id', user.id);

    const subMap: Record<string, Submission> = {};
    (subData || []).forEach((s: any) => { subMap[s.exam_id] = s; });
    setSubmissions(subMap);
    setLoading(false);
  };

  const startExam = (exam: Exam) => {
    setActiveExam(exam);
    setAnswers(exam.questions.map(q => q.type === 'mcq' ? null : ''));
  };

  const handleSubmit = async () => {
    if (!activeExam || !user) return;
    setSubmitting(true);
    const { error } = await (supabase as any).from('exam_submissions').insert({
      exam_id: activeExam.id,
      student_id: user.id,
      answers,
    });
    if (error) {
      if (error.code === '23505') {
        toast({ title: 'Already submitted', description: 'You have already submitted this exam.', variant: 'destructive' });
      } else {
        toast({ title: 'Submission failed', description: error.message, variant: 'destructive' });
      }
    } else {
      toast({ title: 'Exam submitted!', description: 'Your answers have been recorded.' });
      setActiveExam(null);
      fetchData();
    }
    setSubmitting(false);
  };

  if (authLoading || loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{[1, 2].map(i => <Skeleton key={i} className="h-36" />)}</div>
      </div>
    );
  }

  // Viewing graded result
  if (viewingResult) {
    const { exam, sub } = viewingResult;
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => setViewingResult(null)}>
          <ArrowLeft className="h-4 w-4 mr-1" />Back to exams
        </Button>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">{exam.title} — Results</h2>
          <Badge variant="default">{sub.total_marks_obtained}/{exam.total_marks}</Badge>
        </div>
        {exam.questions.map((q, idx) => (
          <Card key={q.id} className="border-l-4 border-l-primary">
            <CardContent className="pt-4 space-y-2">
              <div className="flex items-center justify-between">
                <Badge variant={q.type === 'mcq' ? 'default' : 'secondary'}>{q.type.toUpperCase()}</Badge>
                <span className="text-sm font-medium">{sub.grades[idx] ?? '?'} / {q.marks}</span>
              </div>
              <p className="font-medium text-foreground">{q.question}</p>
              {q.type === 'mcq' && q.options ? (
                <div className="space-y-1">
                  {q.options.map((opt, oIdx) => (
                    <div key={oIdx} className={`text-sm p-2 rounded ${sub.answers[idx] === oIdx ? 'bg-primary/10 border border-primary/30 font-medium' : 'text-muted-foreground'}`}>
                      {opt} {sub.answers[idx] === oIdx && '← your answer'}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-muted/50 p-3 rounded text-sm">{sub.answers[idx] || 'No answer'}</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Taking exam
  if (activeExam) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">{activeExam.title}</h2>
            <p className="text-sm text-muted-foreground">{activeExam.questions.length} questions • {activeExam.total_marks} marks • {activeExam.duration_minutes} min</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setActiveExam(null)}>Cancel</Button>
        </div>

        {activeExam.questions.map((q, idx) => (
          <Card key={q.id}>
            <CardContent className="pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <Badge variant={q.type === 'mcq' ? 'default' : 'secondary'}>Q{idx + 1} • {q.type.toUpperCase()}</Badge>
                <span className="text-sm text-muted-foreground">{q.marks} marks</span>
              </div>
              <p className="font-medium text-foreground">{q.question}</p>
              {q.type === 'mcq' && q.options ? (
                <div className="space-y-2">
                  {q.options.map((opt, oIdx) => (
                    <button
                      key={oIdx}
                      onClick={() => setAnswers(prev => prev.map((a, i) => i === idx ? oIdx : a))}
                      className={`w-full text-left p-3 rounded-lg border text-sm transition-colors ${
                        answers[idx] === oIdx ? 'bg-primary/10 border-primary text-foreground' : 'bg-card border-border text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              ) : (
                <Textarea
                  placeholder="Write your answer here..."
                  value={answers[idx] || ''}
                  onChange={e => setAnswers(prev => prev.map((a, i) => i === idx ? e.target.value : a))}
                  className="min-h-[120px]"
                />
              )}
            </CardContent>
          </Card>
        ))}

        <Button onClick={handleSubmit} disabled={submitting} className="w-full" size="lg">
          <Send className="h-4 w-4 mr-2" />{submitting ? 'Submitting...' : 'Submit Exam'}
        </Button>
      </div>
    );
  }

  // Exam list
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />Exams
        </h1>
        <p className="text-sm text-muted-foreground">View and take exams assigned by your faculty</p>
      </div>

      {exams.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">No exams available</CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {exams.map(exam => {
            const sub = submissions[exam.id];
            return (
              <Card key={exam.id}>
                <CardContent className="pt-4 space-y-3">
                  <h3 className="font-semibold text-foreground">{exam.title}</h3>
                  {exam.description && <p className="text-sm text-muted-foreground">{exam.description}</p>}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />{exam.duration_minutes} min</Badge>
                    <Badge variant="secondary">{exam.total_marks} marks</Badge>
                    <Badge variant="secondary">{exam.questions.length} Q</Badge>
                  </div>
                  {sub ? (
                    sub.is_graded ? (
                      <div className="flex items-center justify-between">
                        <Badge variant="default"><CheckCircle2 className="h-3 w-3 mr-1" />{sub.total_marks_obtained}/{exam.total_marks}</Badge>
                        <Button variant="outline" size="sm" onClick={() => setViewingResult({ exam, sub })}>View Results</Button>
                      </div>
                    ) : (
                      <Badge variant="outline"><AlertCircle className="h-3 w-3 mr-1" />Submitted — Awaiting grades</Badge>
                    )
                  ) : (
                    <Button size="sm" onClick={() => startExam(exam)}>Start Exam</Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
