import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Megaphone, Calendar, AlertTriangle, PartyPopper, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Notice {
  id: string;
  title: string;
  description: string;
  type: string;
  priority: string;
  image_url: string | null;
  starts_at: string;
  expires_at: string | null;
  created_at: string;
}

const NoticesPage = () => {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await (supabase as any)
        .from('notices')
        .select('*')
        .eq('is_active', true)
        .lte('starts_at', new Date().toISOString())
        .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });
      setNotices(data || []);
      setLoading(false);
    };
    fetch();
  }, []);

  const typeIcon = (type: string) => {
    if (type === 'urgent') return <AlertTriangle className="h-4 w-4" />;
    if (type === 'event') return <PartyPopper className="h-4 w-4" />;
    if (type === 'advertisement') return <Megaphone className="h-4 w-4" />;
    return <Info className="h-4 w-4" />;
  };

  const priorityStyle = (priority: string) => {
    if (priority === 'urgent') return 'border-destructive/40 bg-destructive/5';
    if (priority === 'high') return 'border-accent/40 bg-accent/5';
    return 'border-border';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-heading text-foreground flex items-center gap-2">
          <Megaphone className="h-6 w-6 text-primary" />
          Notices & Announcements
        </h1>
        <p className="text-muted-foreground">Stay updated with campus events and important notices</p>
      </div>

      {loading ? (
        <div className="space-y-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-40 w-full" />)}</div>
      ) : notices.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Megaphone className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
            <p className="text-muted-foreground">No active notices at the moment.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {notices.map(notice => (
            <Card key={notice.id} className={cn("overflow-hidden border", priorityStyle(notice.priority))}>
              <CardContent className="p-0">
                <div className="flex flex-col sm:flex-row">
                  {notice.image_url && (
                    <div className="sm:w-56 h-48 sm:h-auto shrink-0">
                      <img src={notice.image_url} alt={notice.title} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="p-6 flex-1">
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      <Badge variant={notice.priority === 'urgent' ? 'destructive' : notice.type === 'event' ? 'default' : 'secondary'} className="gap-1 capitalize">
                        {typeIcon(notice.type)}{notice.type}
                      </Badge>
                      {notice.priority !== 'normal' && notice.priority !== 'low' && (
                        <Badge variant={notice.priority === 'urgent' ? 'destructive' : 'default'} className="capitalize text-xs">
                          {notice.priority} priority
                        </Badge>
                      )}
                      {notice.priority === 'urgent' && <span className="text-xs text-destructive font-semibold animate-pulse">⚠ URGENT</span>}
                    </div>
                    <h2 className="text-xl font-bold text-foreground mb-2">{notice.title}</h2>
                    {notice.description && <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{notice.description}</p>}
                    <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        Posted {new Date(notice.starts_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                      {notice.expires_at && (
                        <span>Expires {new Date(notice.expires_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default NoticesPage;
