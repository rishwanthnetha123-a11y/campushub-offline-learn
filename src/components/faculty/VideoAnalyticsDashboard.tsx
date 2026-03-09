import { useState, useEffect } from 'react';
import { BarChart3, Users, Eye, AlertTriangle, TrendingUp, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';

interface VideoAnalyticsRow {
  student_id: string;
  video_id: string;
  watch_time: number;
  skip_count: number;
  completion_percentage: number;
  idle_time: number;
  attention_score: number;
  engagement_level: string;
  total_duration: number;
  student_name?: string;
  student_email?: string;
  video_title?: string;
}

interface VideoOption {
  id: string;
  title: string;
  subject: string;
}

export function VideoAnalyticsDashboard() {
  const { user } = useAuthContext();
  const [analytics, setAnalytics] = useState<VideoAnalyticsRow[]>([]);
  const [videos, setVideos] = useState<VideoOption[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchVideos();
    }
  }, [user]);

  useEffect(() => {
    if (user) fetchAnalytics();
  }, [user, selectedVideo]);

  const fetchVideos = async () => {
    if (!user) return;
    const { data } = await (supabase as any)
      .from('videos')
      .select('id, title, subject')
      .eq('uploaded_by', user.id)
      .order('created_at', { ascending: false });
    setVideos(data || []);
  };

  const fetchAnalytics = async () => {
    if (!user) return;
    setLoading(true);

    // Get video IDs uploaded by this faculty
    let videoIds: string[] = [];
    if (selectedVideo === 'all') {
      const { data: vids } = await (supabase as any)
        .from('videos')
        .select('id')
        .eq('uploaded_by', user.id);
      videoIds = (vids || []).map((v: any) => v.id);
    } else {
      videoIds = [selectedVideo];
    }

    if (videoIds.length === 0) {
      setAnalytics([]);
      setLoading(false);
      return;
    }

    const { data } = await (supabase as any)
      .from('video_analytics')
      .select('*')
      .in('video_id', videoIds);

    if (!data || data.length === 0) {
      setAnalytics([]);
      setLoading(false);
      return;
    }

    // Fetch student profiles and video titles
    const studentIds = [...new Set((data as any[]).map(d => d.student_id))];
    const vidIds = [...new Set((data as any[]).map(d => d.video_id))];

    const [{ data: profiles }, { data: vids }] = await Promise.all([
      (supabase as any).from('profiles').select('id, full_name, email').in('id', studentIds),
      (supabase as any).from('videos').select('id, title').in('id', vidIds),
    ]);

    const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));
    const videoMap = new Map((vids || []).map((v: any) => [v.id, v]));

    const enriched: VideoAnalyticsRow[] = (data as any[]).map(d => ({
      ...d,
      student_name: profileMap.get(d.student_id)?.full_name || 'Unknown',
      student_email: profileMap.get(d.student_id)?.email || '',
      video_title: videoMap.get(d.video_id)?.title || 'Unknown',
    }));

    setAnalytics(enriched);
    setLoading(false);
  };

  const avgCompletion = analytics.length > 0
    ? Math.round(analytics.reduce((sum, a) => sum + Number(a.completion_percentage), 0) / analytics.length)
    : 0;
  const avgAttention = analytics.length > 0
    ? Math.round(analytics.reduce((sum, a) => sum + Number(a.attention_score), 0) / analytics.length)
    : 0;
  const lowEngagement = analytics.filter(a => a.engagement_level === 'low').length;
  const completedCount = analytics.filter(a => Number(a.completion_percentage) >= 90).length;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  const engagementColor = (level: string) => {
    switch (level) {
      case 'high': return 'bg-green-500/10 text-green-700 border-green-200';
      case 'medium': return 'bg-yellow-500/10 text-yellow-700 border-yellow-200';
      case 'low': return 'bg-red-500/10 text-red-700 border-red-200';
      default: return '';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter */}
      <div className="flex items-center gap-4">
        <Select value={selectedVideo} onValueChange={setSelectedVideo}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Filter by video" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Videos</SelectItem>
            {videos.map(v => (
              <SelectItem key={v.id} value={v.id}>{v.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10"><Users className="h-5 w-5 text-primary" /></div>
              <div>
                <p className="text-2xl font-bold">{analytics.length}</p>
                <p className="text-xs text-muted-foreground">Total Views</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10"><TrendingUp className="h-5 w-5 text-green-600" /></div>
              <div>
                <p className="text-2xl font-bold">{avgCompletion}%</p>
                <p className="text-xs text-muted-foreground">Avg Completion</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10"><Eye className="h-5 w-5 text-blue-600" /></div>
              <div>
                <p className="text-2xl font-bold">{avgAttention}</p>
                <p className="text-xs text-muted-foreground">Avg Attention Score</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/10"><AlertTriangle className="h-5 w-5 text-red-600" /></div>
              <div>
                <p className="text-2xl font-bold">{lowEngagement}</p>
                <p className="text-xs text-muted-foreground">Low Engagement</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Student Engagement Details
          </CardTitle>
          <CardDescription>
            {completedCount} of {analytics.length} views completed (≥90%)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {analytics.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No engagement data yet. Students will generate data when they watch your videos.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Video</TableHead>
                    <TableHead>Completion</TableHead>
                    <TableHead>Watch Time</TableHead>
                    <TableHead>Skips</TableHead>
                    <TableHead>Idle</TableHead>
                    <TableHead>Attention</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analytics.map(row => (
                    <TableRow key={row.student_id + row.video_id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{row.student_name}</p>
                          <p className="text-xs text-muted-foreground">{row.student_email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm max-w-[150px] truncate">{row.video_title}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={Number(row.completion_percentage)} className="h-2 w-16" />
                          <span className="text-xs">{Math.round(Number(row.completion_percentage))}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTime(row.watch_time)}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{row.skip_count}</TableCell>
                      <TableCell className="text-sm">{formatTime(row.idle_time)}</TableCell>
                      <TableCell>
                        <span className="font-mono text-sm">{Math.round(Number(row.attention_score))}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={engagementColor(row.engagement_level)}>
                          {row.engagement_level}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
