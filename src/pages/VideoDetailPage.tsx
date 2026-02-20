import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Download, CheckCircle2, Clock, User, BookOpen, Trophy, Loader2, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { VideoPlayer } from '@/components/VideoPlayer';
import { QuizPlayer } from '@/components/QuizPlayer';
import { AIQuizPlayer } from '@/components/AIQuizPlayer';
import { DownloadButton } from '@/components/DownloadButton';
import { OfflineStatusBadge } from '@/components/OfflineStatusBadge';
import { ProgressRing } from '@/components/ProgressRing';
import { useOfflineStorage } from '@/hooks/use-offline-storage';
import { useFileDownload, useLocalFileUrl } from '@/hooks/use-file-download';
import { useAIQuiz, useWatchAnalytics } from '@/hooks/use-ai-learning';
import { demoVideos, demoQuizzes } from '@/data/demo-content';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import type { Video } from '@/types/content';

const VideoDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { 
    getProgress, updateProgress, markCompleted,
    saveQuizAttempt, getBestQuizScore, isOnline
  } = useOfflineStorage();
  const { startDownload, removeFile, getDownloadState, retryDownload } = useFileDownload();

  const [showQuiz, setShowQuiz] = useState(false);
  const [showAIQuiz, setShowAIQuiz] = useState(false);
  const [video, setVideo] = useState<Video | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const { quiz: aiQuiz, loading: aiQuizLoading, generateQuiz } = useAIQuiz(id);
  const { trackPosition } = useWatchAnalytics(id);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    const demoVideo = demoVideos.find(v => v.id === id);
    if (demoVideo) { setVideo(demoVideo); setLoading(false); return; }

    const fetchVideo = async () => {
      const { data, error } = await supabase
        .from('videos').select('*').eq('id', id).eq('is_active', true).maybeSingle();
      if (!error && data) {
        setVideo({
          id: data.id, title: data.title, description: data.description || '',
          duration: data.duration || '0:00', durationSeconds: data.duration_seconds || 0,
          resolution: (data.resolution as '360p' | '480p') || '360p',
          fileSize: data.file_size || '0 MB', fileSizeBytes: data.file_size_bytes || 0,
          subject: data.subject, topic: data.topic || '',
          thumbnailUrl: data.thumbnail_url || '', videoUrl: data.video_url,
          instructor: data.instructor || 'Unknown', order: data.display_order || 0,
        });
      }
      setLoading(false);
    };
    fetchVideo();
  }, [id]);

  const downloadState = getDownloadState(id || '');
  const { url: videoSrc, isLocal } = useLocalFileUrl(id, video?.videoUrl || '');
  const quiz = demoQuizzes.find(q => q.contentId === id);
  const progress = getProgress(id || '');
  const bestQuizScore = quiz ? getBestQuizScore(quiz.id) : undefined;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!video) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Video not found</p>
        <Button variant="link" onClick={() => navigate('/videos')}>Back to Videos</Button>
      </div>
    );
  }

  const isDownloaded = downloadState.state === 'downloaded';
  const canWatch = isDownloaded || isOnline;
  const canTakeQuiz = progress?.completed || false;

  const handleDownload = () => {
    startDownload(video.videoUrl, video.id, 'video', `${video.id}.mp4`);
  };

  const handleRetry = () => {
    retryDownload(video.videoUrl, video.id, 'video', `${video.id}.mp4`);
  };

  const handleProgress = (percent: number, currentTime: number) => {
    updateProgress(video.id, 'video', { progress: Math.round(percent), lastPosition: currentTime });
  };

  const handleComplete = () => markCompleted(video.id, 'video');

  const handleQuizComplete = (score: number, passed: boolean, answers: number[]) => {
    if (quiz) {
      saveQuizAttempt({ quizId: quiz.id, answers, score, passed });
      if (passed) updateProgress(video.id, 'video', { quizCompleted: true, quizScore: score });
    }
  };

  if (showQuiz && quiz) {
    return (
      <div className="max-w-2xl mx-auto py-8 animate-fade-in">
        <Button variant="ghost" onClick={() => setShowQuiz(false)} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />Back to Video
        </Button>
        <QuizPlayer quiz={quiz} onComplete={handleQuizComplete} onClose={() => setShowQuiz(false)} bestScore={bestQuizScore} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Button variant="ghost" onClick={() => navigate('/videos')}>
        <ArrowLeft className="h-4 w-4 mr-2" />Back to Videos
      </Button>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {canWatch ? (
            <VideoPlayer
              src={videoSrc}
              title={video.title}
              poster={video.thumbnailUrl}
              onProgress={handleProgress}
              onComplete={handleComplete}
              initialTime={progress?.lastPosition}
              className="aspect-video"
            />
          ) : (
            <Card className="aspect-video flex items-center justify-center bg-muted">
              <div className="text-center p-6">
                <Download className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="font-medium mb-2">Download required for offline viewing</p>
                <p className="text-sm text-muted-foreground mb-4">
                  You're offline. Download this video when you have internet access.
                </p>
              </div>
            </Card>
          )}

          {isLocal && (
            <div className="flex items-center gap-2 text-sm text-success">
              <CheckCircle2 className="h-4 w-4" />
              Playing from local storage (offline)
            </div>
          )}

          <div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-sm font-medium text-primary">{video.subject} • {video.topic}</span>
                <h1 className="text-heading text-foreground mt-1">{video.title}</h1>
              </div>
              <OfflineStatusBadge status={isDownloaded ? 'offline-ready' : 'not-downloaded'} />
            </div>
            <p className="text-muted-foreground mt-3">{video.description}</p>
            <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{video.duration}</span>
              <span className="flex items-center gap-1"><User className="h-4 w-4" />{video.instructor}</span>
              <span>{video.resolution} • {video.fileSize}</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-3">Offline Access</h3>
              <DownloadButton
                downloadState={downloadState.state}
                progress={downloadState.progress}
                fileSize={video.fileSize}
                error={downloadState.error}
                onDownload={handleDownload}
                onRemove={() => removeFile(video.id)}
                onRetry={handleRetry}
              />
              <p className="text-xs text-muted-foreground mt-3">
                {isDownloaded ? 'This video is available offline' : 'Download for offline viewing when you have internet'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-3">Your Progress</h3>
              <div className="flex items-center gap-4">
                <ProgressRing progress={progress?.progress || 0} size={64} strokeWidth={6} />
                <div>
                  <p className="font-medium">{progress?.completed ? 'Completed!' : 'In Progress'}</p>
                  <p className="text-sm text-muted-foreground">{Math.round(progress?.progress || 0)}% watched</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {quiz && (
            <Card className={cn("border-2", progress?.quizCompleted ? "border-success/30" : "border-primary/30")}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold flex items-center gap-2"><BookOpen className="h-5 w-5" />Quiz</h3>
                  {progress?.quizCompleted && (
                    <span className="text-success flex items-center gap-1 text-sm"><CheckCircle2 className="h-4 w-4" />Passed</span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-4">{quiz.questions.length} questions • {quiz.passingScore}% to pass</p>
                {bestQuizScore !== undefined && (
                  <div className="flex items-center gap-2 mb-4 text-sm"><Trophy className="h-4 w-4 text-accent" /><span>Best score: {bestQuizScore}%</span></div>
                )}
                <Button className="w-full" disabled={!canTakeQuiz} onClick={() => setShowQuiz(true)}>
                  {progress?.quizCompleted ? 'Retake Quiz' : canTakeQuiz ? 'Take Quiz' : 'Complete video first'}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoDetailPage;
