import { useState } from 'react';
import { Bell, BellRing, Check, CheckCheck, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotifications } from '@/hooks/use-notifications';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

const typeIcons: Record<string, string> = {
  exam: '📝',
  notice: '📢',
  video: '🎬',
  schedule: '📅',
  general: '🔔',
};

export function NotificationBell() {
  const {
    notifications,
    unreadCount,
    permissionGranted,
    requestPermission,
    markAsRead,
    markAllRead,
    clearAll,
  } = useNotifications();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
        aria-label="Notifications"
      >
        {unreadCount > 0 ? (
          <BellRing className="h-5 w-5 text-primary animate-pulse" />
        ) : (
          <Bell className="h-5 w-5" />
        )}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          {/* Dropdown */}
          <div className="absolute right-0 top-12 z-50 w-80 sm:w-96 rounded-xl border bg-card shadow-xl animate-in slide-in-from-top-2 fade-in-0 duration-200">
            <div className="flex items-center justify-between p-3 border-b">
              <h3 className="font-semibold text-foreground text-sm">Notifications</h3>
              <div className="flex items-center gap-1">
                {!permissionGranted && (
                  <Button variant="ghost" size="sm" className="text-xs h-7" onClick={requestPermission}>
                    Enable Alerts
                  </Button>
                )}
                {unreadCount > 0 && (
                  <Button variant="ghost" size="sm" className="text-xs h-7" onClick={markAllRead}>
                    <CheckCheck className="h-3.5 w-3.5 mr-1" /> Read all
                  </Button>
                )}
                {notifications.length > 0 && (
                  <Button variant="ghost" size="sm" className="text-xs h-7 text-destructive" onClick={clearAll}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <ScrollArea className="max-h-[400px]">
              {notifications.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground text-sm">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  No notifications yet
                </div>
              ) : (
                <div className="divide-y">
                  {notifications.map(n => (
                    <button
                      key={n.id}
                      onClick={() => { if (!n.is_read) markAsRead(n.id); }}
                      className={cn(
                        "w-full text-left p-3 hover:bg-muted/50 transition-colors",
                        !n.is_read && "bg-primary/5"
                      )}
                    >
                      <div className="flex items-start gap-2.5">
                        <span className="text-lg mt-0.5">{typeIcons[n.type] || '🔔'}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={cn("text-sm font-medium truncate", !n.is_read ? "text-foreground" : "text-muted-foreground")}>
                              {n.title}
                            </p>
                            {!n.is_read && <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>
                          <p className="text-[10px] text-muted-foreground/70 mt-1">
                            {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </>
      )}
    </div>
  );
}
