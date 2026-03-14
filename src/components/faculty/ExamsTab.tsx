import { useState, useEffect } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, FileText, CheckCircle2, Clock, Users, Eye } from 'lucide-react';
import ExamGrading from './ExamGrading';
import { notifyClassStudents } from '@/hooks/use-notifications';

interface Question {
  id: string;
  type: 'mcq' | 'written';
  question: string;
  options?: string[];
  correctAnswer?: number; // index for MCQ
  marks: number;
}

interface Exam {
  id: string;
  title: string;
  description: string | null;
  class_id: string;
  subject_id: string;
  duration_minutes: number;
  total_marks: number;
  is_published: boolean;
  questions: Question[];
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
  submission_count?: number;
  graded_count?: number;
}

interface ExamsTabProps {
  classId: string;
}

export default function ExamsTab({ classId }: ExamsTabProps) {
  const { user } = useAuthContext();
  const { toast } = useToast();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [subjects, setSubjects] = useState<{ id: string; subject_name: string }[]>([]);
  const [gradingExamId, setGradingExamId] = useState<string | null>(null);

  // Create form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchExams();
    fetchSubjects();
  }, [classId]);

  const fetchSubjects = async () => {
    if (!user) return;
    const { data } = await (supabase as any)
      .from('faculty_subjects')
      .select('subject_id, subjects(id, subject_name)')
      .eq('faculty_id', user.id)
      .eq('class_id', classId);
    if (data) {
      setSubjects(data.map((d: any) => ({ id: d.subjects.id, subject_name: d.subjects.subject_name })));
    }
  };

  const fetchExams = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await (supabase as any)
      .from('exams')
      .select('*')
      .eq('class_id', classId)
      .eq('created_by', user.id)
      .order('created_at', { ascending: false });

    if (data) {
      // Get submission counts
      const examIds = data.map((e: any) => e.id);
      const { data: subs } = await (supabase as any)
        .from('exam_submissions')
        .select('exam_id, is_graded')
        .in('exam_id', examIds.length ? examIds : ['_']);

      const subMap: Record<string, { total: number; graded: number }> = {};
      (subs || []).forEach((s: any) => {
        if (!subMap[s.exam_id]) subMap[s.exam_id] = { total: 0, graded: 0 };
        subMap[s.exam_id].total++;
        if (s.is_graded) subMap[s.exam_id].graded++;
      });

      setExams(data.map((e: any) => ({
        ...e,
        questions: e.questions || [],
        submission_count: subMap[e.id]?.total || 0,
        graded_count: subMap[e.id]?.graded || 0,
      })));
    }
    setLoading(false);
  };

  const addQuestion = (type: 'mcq' | 'written') => {
    setQuestions(prev => [...prev, {
      id: crypto.randomUUID(),
      type,
      question: '',
      options: type === 'mcq' ? ['', '', '', ''] : undefined,
      correctAnswer: type === 'mcq' ? 0 : undefined,
      marks: 10,
    }]);
  };

  const updateQuestion = (idx: number, updates: Partial<Question>) => {
    setQuestions(prev => prev.map((q, i) => i === idx ? { ...q, ...updates } : q));
  };

  const removeQuestion = (idx: number) => {
    setQuestions(prev => prev.filter((_, i) => i !== idx));
  };

  const updateOption = (qIdx: number, oIdx: number, val: string) => {
    setQuestions(prev => prev.map((q, i) => {
      if (i !== qIdx || !q.options) return q;
      const opts = [...q.options];
      opts[oIdx] = val;
      return { ...q, options: opts };
    }));
  };

  const handleCreate = async () => {
    if (!user || !title.trim() || !subjectId || questions.length === 0) {
      toast({ title: 'Fill all fields', description: 'Title, subject and at least one question required.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const totalMarks = questions.reduce((s, q) => s + q.marks, 0);
    const { error } = await (supabase as any).from('exams').insert({
      title: title.trim(),
      description: description.trim() || null,
      class_id: classId,
      subject_id: subjectId,
      created_by: user.id,
      duration_minutes: durationMinutes,
      total_marks: totalMarks,
      questions,
      is_published: false,
    });
    if (error) {
      toast({ title: 'Failed to create exam', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Exam created!' });
      setShowCreate(false);
      resetForm();
      fetchExams();
    }
    setSaving(false);
  };

  const togglePublish = async (exam: Exam) => {
    const newPublished = !exam.is_published;
    await (supabase as any).from('exams').update({ is_published: newPublished }).eq('id', exam.id);
    fetchExams();
    toast({ title: newPublished ? 'Exam published to students!' : 'Exam unpublished' });

    // Notify students when publishing
    if (newPublished) {
      notifyClassStudents(classId, {
        title: '📝 New Exam Published',
        body: `"${exam.title}" is now available. Duration: ${exam.duration_minutes} min, Total: ${exam.total_marks} marks.`,
        type: 'exam',
        reference_id: exam.id,
      }).catch(console.error);
    }
  };

  const deleteExam = async (id: string) => {
    await (supabase as any).from('exams').delete().eq('id', id);
    fetchExams();
    toast({ title: 'Exam deleted' });
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setSubjectId('');
    setDurationMinutes(60);
    setQuestions([]);
  };

  if (gradingExamId) {
    return <ExamGrading examId={gradingExamId} onBack={() => { setGradingExamId(null); fetchExams(); }} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Exams & Tests</h2>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" />Create Exam</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Exam</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input placeholder="Exam title" value={title} onChange={e => setTitle(e.target.value)} />
              <Textarea placeholder="Description (optional)" value={description} onChange={e => setDescription(e.target.value)} />
              <div className="grid grid-cols-2 gap-3">
                <Select value={subjectId} onValueChange={setSubjectId}>
                  <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                  <SelectContent>
                    {subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.subject_name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-2">
                  <Input type="number" min={10} max={300} value={durationMinutes} onChange={e => setDurationMinutes(Number(e.target.value))} className="w-20" />
                  <span className="text-sm text-muted-foreground">minutes</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-foreground">Questions ({questions.length})</h3>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => addQuestion('mcq')}>+ MCQ</Button>
                    <Button variant="outline" size="sm" onClick={() => addQuestion('written')}>+ Written</Button>
                  </div>
                </div>

                {questions.map((q, idx) => (
                  <Card key={q.id} className="border-l-4 border-l-primary">
                    <CardContent className="pt-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge variant={q.type === 'mcq' ? 'default' : 'secondary'}>{q.type.toUpperCase()}</Badge>
                        <div className="flex items-center gap-2">
                          <Input type="number" min={1} max={100} value={q.marks} onChange={e => updateQuestion(idx, { marks: Number(e.target.value) })} className="w-20" />
                          <span className="text-xs text-muted-foreground">marks</span>
                          <Button variant="ghost" size="icon" onClick={() => removeQuestion(idx)} className="h-8 w-8 text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <Textarea placeholder={`Question ${idx + 1}`} value={q.question} onChange={e => updateQuestion(idx, { question: e.target.value })} />
                      {q.type === 'mcq' && q.options && (
                        <div className="space-y-2">
                          {q.options.map((opt, oIdx) => (
                            <div key={oIdx} className="flex items-center gap-2">
                              <input
                                type="radio" name={`q-${q.id}`} checked={q.correctAnswer === oIdx}
                                onChange={() => updateQuestion(idx, { correctAnswer: oIdx })}
                                className="accent-primary"
                              />
                              <Input placeholder={`Option ${oIdx + 1}`} value={opt} onChange={e => updateOption(idx, oIdx, e.target.value)} className="flex-1" />
                            </div>
                          ))}
                          <p className="text-xs text-muted-foreground">Select the correct answer above</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {questions.length > 0 && (
                <p className="text-sm text-muted-foreground">Total: {questions.reduce((s, q) => s + q.marks, 0)} marks</p>
              )}

              <Button onClick={handleCreate} disabled={saving} className="w-full">
                {saving ? 'Creating...' : 'Create Exam'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2].map(i => <Skeleton key={i} className="h-32" />)}</div>
      ) : exams.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground"><FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />No exams created yet</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {exams.map(exam => (
            <Card key={exam.id}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h3 className="font-semibold text-foreground">{exam.title}</h3>
                    {exam.description && <p className="text-sm text-muted-foreground">{exam.description}</p>}
                    <div className="flex items-center gap-2 flex-wrap mt-2">
                      <Badge variant={exam.is_published ? 'default' : 'outline'}>
                        {exam.is_published ? 'Published' : 'Draft'}
                      </Badge>
                      <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />{exam.duration_minutes} min</Badge>
                      <Badge variant="secondary">{exam.total_marks} marks</Badge>
                      <Badge variant="secondary">{exam.questions.length} questions</Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{exam.submission_count} submissions</span>
                      <span className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" />{exam.graded_count} graded</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Button variant="outline" size="sm" onClick={() => togglePublish(exam)}>
                      {exam.is_published ? 'Unpublish' : 'Publish'}
                    </Button>
                    {(exam.submission_count || 0) > 0 && (
                      <Button variant="outline" size="sm" onClick={() => setGradingExamId(exam.id)}>
                        <Eye className="h-3.5 w-3.5 mr-1" />Grade
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteExam(exam.id)}>
                      <Trash2 className="h-3.5 w-3.5 mr-1" />Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
