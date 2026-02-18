import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Video as VideoIcon, Globe } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ContentCard } from '@/components/ContentCard';
import { useOfflineStorage } from '@/hooks/use-offline-storage';
import { subjects, demoQuizzes } from '@/data/demo-content';
import { supabase } from '@/integrations/supabase/client';
import { CONTENT_LANGUAGES } from '@/lib/languages';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Video } from '@/types/content';

const VideosPage = () => {
  const navigate = useNavigate();
  const { isDownloaded, markAsDownloaded, removeDownload, getProgress, getBestQuizScore } = useOfflineStorage();
  const { language, t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [dbVideos, setDbVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  // Auto-set content language filter from global language
  useEffect(() => {
    setSelectedLanguage(null); // reset to show all when global lang changes
  }, [language]);

  useEffect(() => {
    const fetchVideos = async () => {
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (!error && data) {
        const mapped: Video[] = data.map((v, i) => ({
          id: v.id, title: v.title, description: v.description || '', duration: v.duration || '0:00',
          durationSeconds: v.duration_seconds || 0, resolution: (v.resolution as '360p' | '480p') || '360p',
          fileSize: v.file_size || '0 MB', fileSizeBytes: v.file_size_bytes || 0, subject: v.subject,
          topic: v.topic || '', thumbnailUrl: v.thumbnail_url || '', videoUrl: v.video_url,
          instructor: v.instructor || 'Unknown', order: v.display_order || i,
          language: (v as any).language || 'en',
        }));
        setDbVideos(mapped);
      }
      setLoading(false);
    };
    fetchVideos();
  }, []);

  const allSubjects = useMemo(() => {
    const s = new Set([...subjects, ...dbVideos.map(v => v.subject)]);
    return Array.from(s);
  }, [dbVideos]);

  const filteredVideos = dbVideos.filter(video => {
    const matchesSearch = video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      video.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = !selectedSubject || video.subject === selectedSubject;
    const matchesLanguage = !selectedLanguage || video.language === selectedLanguage;
    return matchesSearch && matchesSubject && matchesLanguage;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-heading text-foreground flex items-center gap-2">
            <VideoIcon className="h-6 w-6 text-primary" />
            {t.videos_title}
          </h1>
          <p className="text-muted-foreground">{dbVideos.length} {t.videos_subtitle}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder={t.videos_search} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant={selectedSubject === null ? "default" : "outline"} size="sm" onClick={() => setSelectedSubject(null)}>{t.videos_all}</Button>
          {allSubjects.map(subject => (
            <Button key={subject} variant={selectedSubject === subject ? "default" : "outline"} size="sm" onClick={() => setSelectedSubject(subject)}>{subject}</Button>
          ))}
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <Globe className="h-4 w-4 text-muted-foreground" />
          <Button variant={selectedLanguage === null ? "default" : "outline"} size="sm" onClick={() => setSelectedLanguage(null)}>{t.videos_all_languages}</Button>
          {CONTENT_LANGUAGES.slice(0, 5).map(lang => (
            <Button key={lang.code} variant={selectedLanguage === lang.code ? "default" : "outline"} size="sm" onClick={() => setSelectedLanguage(lang.code)}>{lang.nativeName}</Button>
          ))}
        </div>
      </div>

      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 flex items-center gap-3">
        <div className="p-2 rounded-full bg-primary/10"><VideoIcon className="h-5 w-5 text-primary" /></div>
        <div>
          <p className="font-medium text-foreground">{t.videos_low_data}</p>
          <p className="text-sm text-muted-foreground">{t.videos_low_data_desc}</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredVideos.map(video => {
          const progress = getProgress(video.id);
          const quiz = demoQuizzes.find(q => q.contentId === video.id);
          const quizScore = quiz ? getBestQuizScore(quiz.id) : undefined;
          return (
            <ContentCard key={video.id} content={video} type="video" isDownloaded={isDownloaded(video.id)} learningProgress={progress?.progress}
              quizCompleted={progress?.quizCompleted || false} onDownload={() => markAsDownloaded(video.id, 'video')} onRemove={() => removeDownload(video.id)}
              onClick={() => navigate(`/video/${video.id}`)} />
          );
        })}
      </div>

      {filteredVideos.length === 0 && (
        <div className="text-center py-12">
          <VideoIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">{t.videos_no_results}</p>
        </div>
      )}
    </div>
  );
};

export default VideosPage;
