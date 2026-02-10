// Offline Storage Hook - LocalStorage based with DB sync
import { useState, useEffect, useCallback } from 'react';
import { 
  DownloadedContent, 
  LearningProgress, 
  SyncQueueItem, 
  QuizAttempt,
  OfflineStatus 
} from '@/types/content';
import { supabase } from '@/integrations/supabase/client';

const STORAGE_KEYS = {
  DOWNLOADS: 'campushub_downloads',
  PROGRESS: 'campushub_progress',
  QUIZ_ATTEMPTS: 'campushub_quiz_attempts',
  SYNC_QUEUE: 'campushub_sync_queue',
  LAST_SYNC: 'campushub_last_sync',
};

// Helper to safely parse JSON from localStorage
const safeJsonParse = <T>(key: string, fallback: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
};

export const useOfflineStorage = () => {
  const [downloads, setDownloads] = useState<DownloadedContent[]>([]);
  const [progress, setProgress] = useState<LearningProgress[]>([]);
  const [quizAttempts, setQuizAttempts] = useState<QuizAttempt[]>([]);
  const [syncQueue, setSyncQueue] = useState<SyncQueueItem[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    setDownloads(safeJsonParse(STORAGE_KEYS.DOWNLOADS, []));
    setProgress(safeJsonParse(STORAGE_KEYS.PROGRESS, []));
    setQuizAttempts(safeJsonParse(STORAGE_KEYS.QUIZ_ATTEMPTS, []));
    setSyncQueue(safeJsonParse(STORAGE_KEYS.SYNC_QUEUE, []));
  }, []);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Sync queue when coming online
  useEffect(() => {
    if (isOnline && syncQueue.length > 0 && !isSyncing) {
      processSyncQueue();
    }
  }, [isOnline, syncQueue.length]);

  const processSyncQueue = async () => {
    if (syncQueue.length === 0) return;
    
    setIsSyncing(true);
    // Clear queue - individual writes happen inline now
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setSyncQueue([]);
    localStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
    setIsSyncing(false);
  };

  // Helper to sync progress to database
  const syncProgressToDb = useCallback(async (
    contentId: string,
    contentType: 'video' | 'resource',
    updates: Partial<LearningProgress>
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const dbUpdates = {
        user_id: user.id,
        content_id: contentId,
        content_type: contentType,
        ...(updates.progress !== undefined && { progress: updates.progress }),
        ...(updates.completed !== undefined && { completed: updates.completed }),
        ...(updates.completedAt && { completed_at: updates.completedAt }),
        ...(updates.lastPosition !== undefined && { last_position: Math.floor(updates.lastPosition) }),
        ...(updates.quizCompleted !== undefined && { quiz_completed: updates.quizCompleted }),
        ...(updates.quizScore !== undefined && { quiz_score: updates.quizScore }),
      };

      await (supabase as any)
        .from('student_progress')
        .upsert(dbUpdates, { onConflict: 'user_id,content_id,content_type' });
    } catch (err) {
      console.error('Failed to sync progress to DB:', err);
    }
  }, []);

  // Helper to sync quiz attempt to database
  const syncQuizToDb = useCallback(async (attempt: QuizAttempt) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('quiz_attempts')
        .insert({
          user_id: user.id,
          quiz_id: attempt.quizId,
          answers: attempt.answers,
          score: attempt.score,
          passed: attempt.passed,
        });
    } catch (err) {
      console.error('Failed to sync quiz attempt to DB:', err);
    }
  }, []);

  const addToSyncQueue = useCallback((item: Omit<SyncQueueItem, 'id' | 'createdAt' | 'retries'>) => {
    const newItem: SyncQueueItem = {
      ...item,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      retries: 0,
    };
    
    setSyncQueue(prev => {
      const updated = [...prev, newItem];
      localStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Download management
  const markAsDownloaded = useCallback((contentId: string, contentType: 'video' | 'resource') => {
    const newDownload: DownloadedContent = {
      id: crypto.randomUUID(),
      contentId,
      contentType,
      downloadedAt: new Date().toISOString(),
      lastAccessedAt: new Date().toISOString(),
    };

    setDownloads(prev => {
      const existing = prev.filter(d => d.contentId !== contentId);
      const updated = [...existing, newDownload];
      localStorage.setItem(STORAGE_KEYS.DOWNLOADS, JSON.stringify(updated));
      return updated;
    });

    addToSyncQueue({ action: 'download', data: newDownload });
  }, [addToSyncQueue]);

  const removeDownload = useCallback((contentId: string) => {
    setDownloads(prev => {
      const updated = prev.filter(d => d.contentId !== contentId);
      localStorage.setItem(STORAGE_KEYS.DOWNLOADS, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const isDownloaded = useCallback((contentId: string): boolean => {
    return downloads.some(d => d.contentId === contentId);
  }, [downloads]);

  const getOfflineStatus = useCallback((contentId: string, requiresInternet: boolean = false): OfflineStatus => {
    if (isDownloaded(contentId)) {
      return 'offline-ready';
    }
    if (requiresInternet) {
      return 'needs-internet';
    }
    return 'not-downloaded';
  }, [isDownloaded]);

  // Progress management
  const updateProgress = useCallback((
    contentId: string, 
    contentType: 'video' | 'resource',
    updates: Partial<LearningProgress>
  ) => {
    setProgress(prev => {
      const existing = prev.find(p => p.contentId === contentId);
      const updated: LearningProgress = existing 
        ? { ...existing, ...updates }
        : {
            id: crypto.randomUUID(),
            contentId,
            contentType,
            progress: 0,
            completed: false,
            quizCompleted: false,
            ...updates,
          };

      const newProgress = [
        ...prev.filter(p => p.contentId !== contentId),
        updated,
      ];
      
      localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(newProgress));
      return newProgress;
    });

    // Sync to database
    syncProgressToDb(contentId, contentType, updates);

    addToSyncQueue({ action: 'progress', data: { contentId, contentType, updates } });
  }, [addToSyncQueue, syncProgressToDb]);

  const getProgress = useCallback((contentId: string): LearningProgress | undefined => {
    return progress.find(p => p.contentId === contentId);
  }, [progress]);

  const markCompleted = useCallback((contentId: string, contentType: 'video' | 'resource') => {
    updateProgress(contentId, contentType, {
      progress: 100,
      completed: true,
      completedAt: new Date().toISOString(),
    });
  }, [updateProgress]);

  // Quiz management
  const saveQuizAttempt = useCallback((attempt: Omit<QuizAttempt, 'id' | 'completedAt'>) => {
    const newAttempt: QuizAttempt = {
      ...attempt,
      id: crypto.randomUUID(),
      completedAt: new Date().toISOString(),
    };

    setQuizAttempts(prev => {
      const updated = [...prev, newAttempt];
      localStorage.setItem(STORAGE_KEYS.QUIZ_ATTEMPTS, JSON.stringify(updated));
      return updated;
    });

    // Sync to database
    syncQuizToDb(newAttempt);

    addToSyncQueue({ action: 'quiz', data: newAttempt });

    return newAttempt;
  }, [addToSyncQueue, syncQuizToDb]);

  const getQuizAttempts = useCallback((quizId: string): QuizAttempt[] => {
    return quizAttempts.filter(a => a.quizId === quizId);
  }, [quizAttempts]);

  const getBestQuizScore = useCallback((quizId: string): number | undefined => {
    const attempts = getQuizAttempts(quizId);
    if (attempts.length === 0) return undefined;
    return Math.max(...attempts.map(a => a.score));
  }, [getQuizAttempts]);

  // Storage stats
  const getStorageStats = useCallback(() => {
    const totalDownloads = downloads.length;
    const completedCount = progress.filter(p => p.completed).length;
    const quizzesPassed = quizAttempts.filter(a => a.passed).length;
    
    return {
      totalDownloads,
      completedCount,
      quizzesPassed,
      syncPending: syncQueue.length,
    };
  }, [downloads, progress, quizAttempts, syncQueue]);

  return {
    // State
    downloads,
    progress,
    quizAttempts,
    isOnline,
    isSyncing,
    syncPending: syncQueue.length,

    // Download methods
    markAsDownloaded,
    removeDownload,
    isDownloaded,
    getOfflineStatus,

    // Progress methods
    updateProgress,
    getProgress,
    markCompleted,

    // Quiz methods
    saveQuizAttempt,
    getQuizAttempts,
    getBestQuizScore,

    // Stats
    getStorageStats,
  };
};
