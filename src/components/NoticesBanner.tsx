import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Megaphone, Calendar, AlertTriangle, PartyPopper, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

interface Notice {
  id: string;
  title: string;
  description: string;
  type: string;
  priority: string;
  image_url: string | null;
  starts_at: string;
  expires_at: string | null;
}

export function NoticesBanner() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await (supabase as any)
        .from('notices')
        .select('id, title, description, type, priority, image_url, starts_at, expires_at')
        .eq('is_active', true)
        .lte('starts_at', new Date().toISOString())
        .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(5);
      setNotices(data || []);
      setLoading(false);
    };
    fetch();
  }, []);

  if (loading) return <Skeleton className="h-32 w-full rounded-2xl" />;
  if (notices.length === 0) return null;

  const typeIcon = (type: string) => {
    if (type === 'urgent') return <AlertTriangle className="h-4 w-4" />;
    if (type === 'event') return <PartyPopper className="h-4 w-4" />;
    if (type === 'advertisement') return <Megaphone className="h-4 w-4" />;
    return <Info className="h-4 w-4" />;
  };

  const priorityStyle = (priority: string) => {
    if (priority === 'urgent') return 'border-destructive/40 bg-destructive/5';
    if (priority === 'high') return 'border-accent/40 bg-accent/5';
    return 'border-primary/20 bg-primary/5';
  };

  // Show top notice as hero, rest as compact list
  const [hero, ...rest] = notices;

  return (
    <section className="space-y-3">
      {/* Hero notice */}
      <Link to="/notices">
        <Card className={cn("overflow-hidden cursor-pointer hover:shadow-md transition-shadow border", priorityStyle(hero.priority))}>
          <CardContent className="p-0">
            <div className="flex flex-col sm:flex-row">
              {hero.image_url && (
                <div className="sm:w-48 h-32 sm:h-auto shrink-0">
                  <img src={hero.image_url} alt={hero.title} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="p-5 flex-1">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <Badge variant={hero.priority === 'urgent' ? 'destructive' : 'default'} className="gap-1 capitalize text-xs">
                    {typeIcon(hero.type)}{hero.type}
                  </Badge>
                  {hero.priority === 'urgent' && <Badge variant="destructive" className="text-xs animate-pulse">URGENT</Badge>}
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(hero.starts_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
                <h3 className="font-bold text-foreground text-lg">{hero.title}</h3>
                {hero.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{hero.description}</p>}
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>

      {/* Compact rest */}
      {rest.length > 0 && (
        <div className="grid sm:grid-cols-2 gap-3">
          {rest.map(notice => (
            <Link key={notice.id} to="/notices">
              <div className={cn("flex items-center gap-3 p-3 rounded-xl border cursor-pointer hover:bg-muted/50 transition-colors", priorityStyle(notice.priority))}>
                {notice.image_url && <img src={notice.image_url} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <Badge variant="outline" className="text-[10px] capitalize gap-0.5 px-1.5 py-0">
                      {typeIcon(notice.type)}{notice.type}
                    </Badge>
                  </div>
                  <p className="text-sm font-medium text-foreground truncate">{notice.title}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {notices.length > 0 && (
        <Link to="/notices" className="block text-center text-sm text-primary hover:underline font-medium">
          View all notices →
        </Link>
      )}
    </section>
  );
}
