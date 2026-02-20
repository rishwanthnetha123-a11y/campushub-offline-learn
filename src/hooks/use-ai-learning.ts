// Hooks for AI-powered learning features
import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// ============ AI Quiz Generation ============

interface AIQuizQuestion {
  id: string;
  question: string;
  type: 'mcq' | 'true_false' | 'short_answer';
  options: string[];
  correctAnswer: number;
  correctText?: string;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface AIQuiz {
  id?: string;
  video_id: string;
  questions: AIQuizQuestion[];
  difficulty: string;
  question_count: number;
}

export const useAIQuiz = (videoId: string | undefined) => {
  const [quiz, setQuiz] = useState<AIQuiz | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Check localStorage cache first
  useEffect(() => {
    if (!videoId) return;
    const cached = localStorage.getItem(`ai_quiz_${videoId}`);
    if (cached) {
      try {
        setQuiz(JSON.parse(cached));
      } catch {}
    }
  }, [videoId]);

  const generateQuiz = useCallback(async () => {
    if (!videoId) return;
    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('generate-quiz', {
        body: { videoId },
      });

      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);

      const quizData = data.quiz;
      setQuiz(quizData);
      // Cache locally for offline
      localStorage.setItem(`ai_quiz_${videoId}`, JSON.stringify(quizData));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to generate quiz';
      setError(msg);
      toast({ title: 'Quiz Generation Failed', description: msg, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [videoId, toast]);

  return { quiz, loading, error, generateQuiz };
};

// ============ Watch Analytics ============

interface WatchSegment {
  start: number;
  end: number;
  timestamp: string;
}

export const useWatchAnalytics = (videoId: string | undefined) => {
  const segmentsRef = useRef<WatchSegment[]>([]);
  const lastPositionRef = useRef(0);
  const maxPositionRef = useRef(0);
  const sessionStartRef = useRef<string>(new Date().toISOString());
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const trackPosition = useCallback((currentTime: number) => {
    if (!videoId) return;
    
    const now = currentTime;
    const last = lastPositionRef.current;
    
    // Detect rewatch (jumped backward by more than 5 seconds)
    if (now < last - 5) {
      // End previous segment
      if (segmentsRef.current.length > 0) {
        const lastSeg = segmentsRef.current[segmentsRef.current.length - 1];
        if (!lastSeg.end) lastSeg.end = last;
      }
      // Start new segment (rewatch)
      segmentsRef.current.push({ start: now, end: 0, timestamp: new Date().toISOString() });
    } else if (now > last + 2) {
      // Jumped forward (skip detected)
      if (segmentsRef.current.length > 0) {
        const lastSeg = segmentsRef.current[segmentsRef.current.length - 1];
        if (!lastSeg.end) lastSeg.end = last;
      }
      segmentsRef.current.push({ start: now, end: 0, timestamp: new Date().toISOString() });
    } else if (segmentsRef.current.length === 0) {
      segmentsRef.current.push({ start: now, end: 0, timestamp: new Date().toISOString() });
    }

    lastPositionRef.current = now;
    if (now > maxPositionRef.current) maxPositionRef.current = now;

    // Debounced sync every 30 seconds
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = setTimeout(() => syncToDb(), 30000);
  }, [videoId]);

  const syncToDb = useCallback(async () => {
    if (!videoId) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Close open segments
      const segments = segmentsRef.current.map(s => ({
        ...s,
        end: s.end || lastPositionRef.current,
      }));

      const totalWatchTime = segments.reduce((t, s) => t + (s.end - s.start), 0);
      const rewatchCount = segments.filter((s, i) => {
        if (i === 0) return false;
        return segments.slice(0, i).some(prev => s.start >= prev.start && s.start <= prev.end);
      }).length;

      await (supabase as any)
        .from('watch_analytics')
        .upsert({
          user_id: user.id,
          video_id: videoId,
          watch_segments: segments,
          total_watch_time: Math.round(totalWatchTime),
          rewatch_count: rewatchCount,
          drop_off_point: lastPositionRef.current < maxPositionRef.current * 0.9 ? Math.round(lastPositionRef.current) : null,
          max_position: Math.round(maxPositionRef.current),
        }, { onConflict: 'user_id,video_id' });
    } catch (err) {
      console.error('Watch analytics sync failed:', err);
    }
  }, [videoId]);

  // Sync on unmount
  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
      syncToDb();
    };
  }, [syncToDb]);

  return { trackPosition, syncToDb };
};

// ============ Study Planner ============

interface StudyTask {
  type: 'watch_video' | 'take_quiz' | 'review_notes' | 'practice' | 'rest';
  title: string;
  subject: string;
  duration_minutes: number;
  video_id?: string;
  priority: 'high' | 'medium' | 'low';
  completed?: boolean;
}

interface StudyDay {
  day: string;
  date_offset: number;
  tasks: StudyTask[];
}

export interface StudyPlan {
  days: StudyDay[];
  focus_subjects: string[];
  weekly_goal: string;
}

export const useStudyPlanner = () => {
  const [plan, setPlan] = useState<StudyPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Load cached plan
  useEffect(() => {
    const cached = localStorage.getItem('campushub_study_plan');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setPlan(parsed.plan_data || parsed);
      } catch {}
    }
  }, []);

  const generatePlan = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Please log in to generate a study plan');

      const { data, error: fnError } = await supabase.functions.invoke('generate-study-plan', {
        body: {},
      });

      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);

      const planData = data.plan?.plan_data || data.plan;
      setPlan(planData);
      localStorage.setItem('campushub_study_plan', JSON.stringify(planData));
      toast({ title: 'Study Plan Generated!', description: 'Your personalized weekly plan is ready.' });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to generate plan';
      setError(msg);
      toast({ title: 'Plan Generation Failed', description: msg, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const toggleTaskComplete = useCallback((dayIndex: number, taskIndex: number) => {
    setPlan(prev => {
      if (!prev) return prev;
      const updated = { ...prev, days: prev.days.map((d, di) => 
        di === dayIndex ? { ...d, tasks: d.tasks.map((t, ti) => 
          ti === taskIndex ? { ...t, completed: !t.completed } : t
        )} : d
      )};
      localStorage.setItem('campushub_study_plan', JSON.stringify(updated));
      return updated;
    });
  }, []);

  return { plan, loading, error, generatePlan, toggleTaskComplete };
};

// ============ Admin Analytics ============

export interface AdminAnalyticsData {
  difficultTopics: Array<{ topic: string; subject: string; avgScore: number; attempts: number }>;
  subjectAnalytics: Array<{ subject: string; avgScore: number; completionRate: number; totalVideos: number; quizAttempts: number }>;
  inactiveStudents: Array<{ id: string; name: string; email: string; joinedAt: string }>;
  completionTrend: Array<{ date: string; completions: number }>;
  dropOffs: Array<{ video: string; avgDropOffSeconds: number; studentCount: number }>;
  summary: { totalStudents: number; activeStudents: number; totalQuizAttempts: number; avgQuizScore: number };
}

export const useAdminAnalytics = () => {
  const [analytics, setAnalytics] = useState<AdminAnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('admin-analytics', {
        body: {},
      });

      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);

      setAnalytics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  }, []);

  return { analytics, loading, error, fetchAnalytics };
};
