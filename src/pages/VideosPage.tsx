import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Video as VideoIcon, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ContentCard } from '@/components/ContentCard';
import { useOfflineStorage } from '@/hooks/use-offline-storage';
import { demoVideos, subjects, demoQuizzes } from '@/data/demo-content';
import { supabase } from '@/integrations/supabase/client';
import type { Video } from '@/types/content';

const VideosPage = () => {
  const navigate = useNavigate();
  const { isDownloaded, markAsDownloaded, removeDownload, getProgress, getBestQuizScore } = useOfflineStorage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [dbVideos, setDbVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVideos = async () => {
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (!error && data) {
        const mapped: Video[] = data.map((v, i) => ({
          id: v.id,
          title: v.title,
          description: v.description || '',
          duration: v.duration || '0:00',
          durationSeconds: v.duration_seconds || 0,
          resolution: (v.resolution as '360p' | '480p') || '360p',
          fileSize: v.file_size || '0 MB',
          fileSizeBytes: v.file_size_bytes || 0,
          subject: v.subject,
          topic: v.topic || '',
          thumbnailUrl: v.thumbnail_url || '',
          videoUrl: v.video_url,
          instructor: v.instructor || 'Unknown',
          order: v.display_order || i,
        }));
        setDbVideos(mapped);
      }
      setLoading(false);
    };
    fetchVideos();
  }, []);

  const allVideos = useMemo(() => [...dbVideos, ...demoVideos], [dbVideos]);

  const allSubjects = useMemo(() => {
    const s = new Set([...subjects, ...dbVideos.map(v => v.subject)]);
    return Array.from(s);
  }, [dbVideos]);

  const filteredVideos = allVideos.filter(video => {
    const matchesSearch = video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      video.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = !selectedSubject || video.subject === selectedSubject;
    return matchesSearch && matchesSubject;
  });

  const handleVideoClick = (videoId: string) => {
    navigate(`/video/${videoId}`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-heading text-foreground flex items-center gap-2">
            <VideoIcon className="h-6 w-6 text-primary" />
            Video Library
          </h1>
          <p className="text-muted-foreground">
            {demoVideos.length} educational videos • Low-resolution for offline use
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search videos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={selectedSubject === null ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedSubject(null)}
          >
            All
          </Button>
          {subjects.map(subject => (
            <Button
              key={subject}
              variant={selectedSubject === subject ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedSubject(subject)}
            >
              {subject}
            </Button>
          ))}
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 flex items-center gap-3">
        <div className="p-2 rounded-full bg-primary/10">
          <VideoIcon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="font-medium text-foreground">Low-Data Mode Active</p>
          <p className="text-sm text-muted-foreground">
            All videos are 360p/480p resolution for minimal data usage. Download for offline viewing.
          </p>
        </div>
      </div>

      {/* Video Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredVideos.map(video => {
          const progress = getProgress(video.id);
          const quiz = demoQuizzes.find(q => q.contentId === video.id);
          const quizScore = quiz ? getBestQuizScore(quiz.id) : undefined;
          
          return (
            <ContentCard
              key={video.id}
              content={video}
              type="video"
              isDownloaded={isDownloaded(video.id)}
              learningProgress={progress?.progress}
              quizCompleted={progress?.quizCompleted || false}
              onDownload={() => markAsDownloaded(video.id, 'video')}
              onRemove={() => removeDownload(video.id)}
              onClick={() => handleVideoClick(video.id)}
            />
          );
        })}
      </div>

      {filteredVideos.length === 0 && (
        <div className="text-center py-12">
          <VideoIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No videos found matching your search.</p>
        </div>
      )}
    </div>
  );
};

export default VideosPage;
