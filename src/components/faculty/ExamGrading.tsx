import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, CheckCircle2, User } from 'lucide-react';

interface ExamGradingProps {
  examId: string;
  onBack: () => void;
}

interface Question {
  id: string;
  type: 'mcq' | 'written';
  question: string;
  options?: string[];
  correctAnswer?: number;
  marks: number;
}

interface Submission {
  id: string;
  student_id: string;
  answers: any[];
  total_marks_obtained: number | null;
  is_graded: boolean;
  grades: any[];
  submitted_at: string;
  student_name?: string;
}

export default function ExamGrading({ examId, onBack }: ExamGradingProps) {
  const { toast } = useToast();
  const [exam, setExam] = useState<any>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSub, setSelectedSub] = useState<Submission | null>(null);
  const [grades, setGrades] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchData(); }, [examId]);

  const fetchData = async () => {
    setLoading(true);
    const { data: examData } = await (supabase as any).from('exams').select('*').eq('id', examId).single();
    if (examData) setExam(examData);

    const { data: subs } = await (supabase as any)
      .from('exam_submissions')
      .select('*')
      .eq('exam_id', examId)
      .order('submitted_at', { ascending: true });

    if (subs && subs.length > 0) {
      const studentIds = subs.map((s: any) => s.student_id);
      const { data: profiles } = await supabase.from('profiles').select('id, full_name').in('id', studentIds);
      const nameMap: Record<string, string> = {};
      (profiles || []).forEach(p => { nameMap[p.id] = p.full_name || 'Unknown'; });
      setSubmissions(subs.map((s: any) => ({ ...s, student_name: nameMap[s.student_id] || 'Unknown' })));
    }
    setLoading(false);
  };

  const openGrading = (sub: Submission) => {
    setSelectedSub(sub);
    const questions: Question[] = exam?.questions || [];
    // Pre-fill grades: auto-grade MCQs, use existing grades for written
    const existingGrades = sub.grades || [];
    const newGrades = questions.map((q, i) => {
      if (existingGrades[i] !== undefined && existingGrades[i] !== null) return existingGrades[i];
      if (q.type === 'mcq') {
        const answer = sub.answers[i];
        return answer === q.correctAnswer ? q.marks : 0;
      }
      return 0;
    });
    setGrades(newGrades);
  };

  const handleSaveGrades = async () => {
    if (!selectedSub || !exam) return;
    setSaving(true);
    const total = grades.reduce((s, g) => s + g, 0);
    const { error } = await (supabase as any)
      .from('exam_submissions')
      .update({
        grades,
        total_marks_obtained: total,
        is_graded: true,
        graded_at: new Date().toISOString(),
      })
      .eq('id', selectedSub.id);

    if (error) {
      toast({ title: 'Failed to save grades', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Grades saved!', description: `Total: ${total}/${exam.total_marks}` });
      setSelectedSub(null);
      fetchData();
    }
    setSaving(false);
  };

  if (loading) return <div className="space-y-3"><Skeleton className="h-8 w-48" /><Skeleton className="h-32" /><Skeleton className="h-32" /></div>;

  const questions: Question[] = exam?.questions || [];

  if (selectedSub) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => setSelectedSub(null)}>
          <ArrowLeft className="h-4 w-4 mr-1" />Back to submissions
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">{selectedSub.student_name}</h2>
            <p className="text-sm text-muted-foreground">{exam.title}</p>
          </div>
          <Badge variant={selectedSub.is_graded ? 'default' : 'outline'}>
            {selectedSub.is_graded ? `Graded: ${selectedSub.total_marks_obtained}/${exam.total_marks}` : 'Ungraded'}
          </Badge>
        </div>

        <div className="space-y-4">
          {questions.map((q, idx) => (
            <Card key={q.id} className="border-l-4 border-l-primary">
              <CardContent className="pt-4 space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant={q.type === 'mcq' ? 'default' : 'secondary'}>{q.type.toUpperCase()}</Badge>
                  <span className="text-sm text-muted-foreground">Max: {q.marks}</span>
                </div>
                <p className="font-medium text-foreground">{q.question}</p>

                {q.type === 'mcq' && q.options ? (
                  <div className="space-y-1">
                    {q.options.map((opt, oIdx) => (
                      <div key={oIdx} className={`text-sm p-2 rounded ${
                        selectedSub.answers[idx] === oIdx
                          ? oIdx === q.correctAnswer ? 'bg-green-500/10 text-green-700 border border-green-500/30' : 'bg-destructive/10 text-destructive border border-destructive/30'
                          : oIdx === q.correctAnswer ? 'bg-green-500/5 text-green-600' : 'text-muted-foreground'
                      }`}>
                        {oIdx === q.correctAnswer && '✓ '}{opt}
                        {selectedSub.answers[idx] === oIdx && oIdx !== q.correctAnswer && ' (selected)'}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-muted/50 p-3 rounded-lg text-sm text-foreground">
                    <p className="text-xs text-muted-foreground mb-1">Student's answer:</p>
                    {selectedSub.answers[idx] || <span className="italic text-muted-foreground">No answer</span>}
                  </div>
                )}

                <div className="flex items-center gap-2 pt-1">
                  <span className="text-sm text-muted-foreground">Marks:</span>
                  <Input
                    type="number" min={0} max={q.marks}
                    value={grades[idx] ?? 0}
                    onChange={e => {
                      const val = Math.min(q.marks, Math.max(0, Number(e.target.value)));
                      setGrades(prev => prev.map((g, i) => i === idx ? val : g));
                    }}
                    className="w-20 h-8"
                  />
                  <span className="text-sm text-muted-foreground">/ {q.marks}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total marks</p>
              <p className="text-2xl font-bold text-foreground">{grades.reduce((s, g) => s + g, 0)} / {exam.total_marks}</p>
            </div>
            <Button onClick={handleSaveGrades} disabled={saving}>
              <CheckCircle2 className="h-4 w-4 mr-1" />{saving ? 'Saving...' : 'Save Grades'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-1" />Back
        </Button>
        <div>
          <h2 className="text-lg font-semibold text-foreground">{exam?.title} — Submissions</h2>
          <p className="text-sm text-muted-foreground">{submissions.length} submissions</p>
        </div>
      </div>

      {submissions.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">No submissions yet</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {submissions.map(sub => (
            <Card key={sub.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => openGrading(sub)}>
              <CardContent className="pt-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-muted"><User className="h-4 w-4 text-muted-foreground" /></div>
                  <div>
                    <p className="font-medium text-foreground">{sub.student_name}</p>
                    <p className="text-xs text-muted-foreground">Submitted {new Date(sub.submitted_at).toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {sub.is_graded ? (
                    <Badge variant="default"><CheckCircle2 className="h-3 w-3 mr-1" />{sub.total_marks_obtained}/{exam?.total_marks}</Badge>
                  ) : (
                    <Badge variant="outline">Ungraded</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
