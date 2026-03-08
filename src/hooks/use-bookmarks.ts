import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export function useBookmarks() {
  const { user } = useAuthContext();
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setBookmarkedIds(new Set());
      setLoading(false);
      return;
    }

    const fetchBookmarks = async () => {
      const { data, error } = await (supabase as any)
        .from('bookmarks')
        .select('video_id')
        .eq('user_id', user.id);

      if (!error && data) {
        setBookmarkedIds(new Set(data.map((b: any) => b.video_id)));
      }
      setLoading(false);
    };

    fetchBookmarks();
  }, [user]);

  const toggleBookmark = useCallback(async (videoId: string) => {
    if (!user) {
      toast.error('Please sign in to bookmark videos');
      return;
    }

    const isCurrentlyBookmarked = bookmarkedIds.has(videoId);

    // Optimistic update
    setBookmarkedIds(prev => {
      const next = new Set(prev);
      if (isCurrentlyBookmarked) {
        next.delete(videoId);
      } else {
        next.add(videoId);
      }
      return next;
    });

    if (isCurrentlyBookmarked) {
      const { error } = await (supabase as any)
        .from('bookmarks')
        .delete()
        .eq('user_id', user.id)
        .eq('video_id', videoId);

      if (error) {
        // Revert
        setBookmarkedIds(prev => new Set(prev).add(videoId));
        toast.error('Failed to remove bookmark');
      } else {
        toast.success('Bookmark removed');
      }
    } else {
      const { error } = await (supabase as any)
        .from('bookmarks')
        .insert({ user_id: user.id, video_id: videoId });

      if (error) {
        // Revert
        setBookmarkedIds(prev => {
          const next = new Set(prev);
          next.delete(videoId);
          return next;
        });
        toast.error('Failed to bookmark video');
      } else {
        toast.success('Video bookmarked!');
      }
    }
  }, [user, bookmarkedIds]);

  const isBookmarked = useCallback((videoId: string) => {
    return bookmarkedIds.has(videoId);
  }, [bookmarkedIds]);

  return { isBookmarked, toggleBookmark, bookmarkedIds, loading };
}
