import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  type: string;
  reference_id: string | null;
  is_read: boolean;
  created_at: string;
}

export function useNotifications() {
  const { user } = useAuthContext();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [permissionGranted, setPermissionGranted] = useState(false);

  // Check browser notification permission
  useEffect(() => {
    if ('Notification' in window) {
      setPermissionGranted(Notification.permission === 'granted');
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) return false;
    const result = await Notification.requestPermission();
    const granted = result === 'granted';
    setPermissionGranted(granted);
    return granted;
  }, []);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    const { data } = await (supabase as any)
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);
    if (data) {
      setNotifications(data);
      setUnreadCount(data.filter((n: any) => !n.is_read).length);
    }
  }, [user]);

  // Subscribe to realtime
  useEffect(() => {
    if (!user) return;
    fetchNotifications();

    const channel = supabase
      .channel('user-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload: any) => {
          const newNotif = payload.new as AppNotification;
          setNotifications(prev => [newNotif, ...prev]);
          setUnreadCount(prev => prev + 1);

          // Show browser notification
          if (permissionGranted && 'Notification' in window) {
            try {
              new Notification(newNotif.title, {
                body: newNotif.body,
                icon: '/icon-192.png',
                tag: newNotif.id,
              });
            } catch (e) {
              // SW notification fallback ignored
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, permissionGranted, fetchNotifications]);

  const markAsRead = useCallback(async (id: string) => {
    await (supabase as any)
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const markAllRead = useCallback(async () => {
    if (!user) return;
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
    if (unreadIds.length === 0) return;
    await (supabase as any)
      .from('notifications')
      .update({ is_read: true })
      .in('id', unreadIds);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
  }, [user, notifications]);

  const clearAll = useCallback(async () => {
    if (!user) return;
    await (supabase as any)
      .from('notifications')
      .delete()
      .eq('user_id', user.id);
    setNotifications([]);
    setUnreadCount(0);
  }, [user]);

  return {
    notifications,
    unreadCount,
    permissionGranted,
    requestPermission,
    markAsRead,
    markAllRead,
    clearAll,
    refetch: fetchNotifications,
  };
}

// Helper to send notifications to students in a class
export async function notifyClassStudents(
  classId: string,
  notification: { title: string; body: string; type: string; reference_id?: string }
) {
  // Get all students in this class
  const { data: students } = await (supabase as any)
    .from('profiles')
    .select('id')
    .eq('class_id', classId);

  if (!students || students.length === 0) return;

  // Get non-student role IDs to exclude
  const { data: roleData } = await (supabase as any)
    .from('user_roles')
    .select('user_id, role');

  const nonStudentIds = new Set(
    (roleData || [])
      .filter((r: any) => r.role === 'faculty' || r.role === 'hod' || r.role === 'admin')
      .map((r: any) => r.user_id)
  );

  const studentIds = students
    .filter((s: any) => !nonStudentIds.has(s.id))
    .map((s: any) => s.id);

  if (studentIds.length === 0) return;

  // Insert notifications in batch
  const notifs = studentIds.map((userId: string) => ({
    user_id: userId,
    title: notification.title,
    body: notification.body,
    type: notification.type,
    reference_id: notification.reference_id || null,
  }));

  await (supabase as any).from('notifications').insert(notifs);
}
