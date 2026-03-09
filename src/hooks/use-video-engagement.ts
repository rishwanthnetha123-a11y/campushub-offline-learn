import { useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface EngagementState {
  watchTime: number;
  skipCount: number;
  idleTime: number;
  lastPosition: number;
  maxPosition: number;
  totalDuration: number;
  isIdle: boolean;
  idleStart: number | null;
}

/**
 * Hook that tracks detailed video engagement metrics:
 * - Watch time, skip count, idle time
 * - Generates an attention score
 * - Syncs to video_analytics table
 */
export function useVideoEngagement(videoId: string | undefined) {
  const stateRef = useRef<EngagementState>({
    watchTime: 0,
    skipCount: 0,
    idleTime: 0,
    lastPosition: 0,
    maxPosition: 0,
    totalDuration: 0,
    isIdle: false,
    idleStart: null,
  });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const visibilityRef = useRef(true);

  // Track tab visibility for idle detection
  useEffect(() => {
    const handleVisibility = () => {
      const hidden = document.hidden;
      const s = stateRef.current;
      if (hidden && !s.isIdle) {
        s.isIdle = true;
        s.idleStart = Date.now();
      } else if (!hidden && s.isIdle) {
        s.isIdle = false;
        if (s.idleStart) {
          s.idleTime += Math.round((Date.now() - s.idleStart) / 1000);
          s.idleStart = null;
        }
      }
      visibilityRef.current = !hidden;
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  const trackTimeUpdate = useCallback((currentTime: number, duration: number) => {
    if (!videoId) return;
    const s = stateRef.current;
    s.totalDuration = Math.round(duration);

    const last = s.lastPosition;
    const diff = currentTime - last;

    // Skip detection: jumped forward by more than 3 seconds
    if (diff > 3) {
      s.skipCount++;
    }

    // Only count real watch time (not skipped segments)
    if (diff > 0 && diff <= 2 && visibilityRef.current) {
      s.watchTime += diff;
    }

    if (currentTime > s.maxPosition) s.maxPosition = currentTime;
    s.lastPosition = currentTime;

    // Debounced sync every 15 seconds
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = setTimeout(() => syncToDb(), 15000);
  }, [videoId]);

  const trackPlay = useCallback(() => {
    // Resume from idle if tab was hidden
    const s = stateRef.current;
    if (s.isIdle && s.idleStart) {
      s.idleTime += Math.round((Date.now() - s.idleStart) / 1000);
      s.idleStart = null;
      s.isIdle = false;
    }
  }, []);

  const trackPause = useCallback(() => {
    // Could start idle timer on pause
  }, []);

  const calculateAttentionScore = useCallback((): number => {
    const s = stateRef.current;
    if (s.totalDuration <= 0) return 100;

    const completionPct = Math.min((s.maxPosition / s.totalDuration) * 100, 100);
    const watchRatio = s.totalDuration > 0 ? Math.min(s.watchTime / s.totalDuration, 1) : 0;
    const skipPenalty = Math.min(s.skipCount * 5, 30); // Max 30% penalty for skips
    const idlePenalty = s.totalDuration > 0 ? Math.min((s.idleTime / s.totalDuration) * 20, 20) : 0;

    const score = Math.max(0, Math.min(100,
      (watchRatio * 50) + (completionPct * 0.3) - skipPenalty - idlePenalty
    ));
    return Math.round(score * 100) / 100;
  }, []);

  const getEngagementLevel = useCallback((): string => {
    const score = calculateAttentionScore();
    if (score >= 70) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
  }, [calculateAttentionScore]);

  const syncToDb = useCallback(async () => {
    if (!videoId) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const s = stateRef.current;
      const completionPct = s.totalDuration > 0
        ? Math.min(Math.round((s.maxPosition / s.totalDuration) * 10000) / 100, 100)
        : 0;

      await (supabase as any)
        .from('video_analytics')
        .upsert({
          student_id: user.id,
          video_id: videoId,
          watch_time: Math.round(s.watchTime),
          skip_count: s.skipCount,
          completion_percentage: completionPct,
          idle_time: s.idleTime,
          attention_score: calculateAttentionScore(),
          engagement_level: getEngagementLevel(),
          last_position: Math.round(s.lastPosition),
          total_duration: s.totalDuration,
        }, { onConflict: 'student_id,video_id' });
    } catch (err) {
      console.error('Video analytics sync failed:', err);
    }
  }, [videoId, calculateAttentionScore, getEngagementLevel]);

  // Sync on unmount
  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
      syncToDb();
    };
  }, [syncToDb]);

  return { trackTimeUpdate, trackPlay, trackPause, syncToDb };
}
