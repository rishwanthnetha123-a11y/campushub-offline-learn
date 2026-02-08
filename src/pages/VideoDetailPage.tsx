import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Download, 
  CheckCircle2, 
  Clock, 
  User,
  BookOpen,
  Trophy
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { VideoPlayer } from '@/components/VideoPlayer';
import { QuizPlayer } from '@/components/QuizPlayer';
import { DownloadButton } from '@/components/DownloadButton';
import { OfflineStatusBadge } from '@/components/OfflineStatusBadge';
import { ProgressRing } from '@/components/ProgressRing';
import { useOfflineStorage } from '@/hooks/use-offline-storage';
import { demoVideos, demoQuizzes } from '@/data/demo-content';
import { cn } from '@/lib/utils';

const VideoDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { 
    isDownloaded, 
    markAsDownloaded, 
    removeDownload, 
    getProgress, 
    updateProgress,
    markCompleted,
    saveQuizAttempt,
    getBestQuizScore,
    isOnline
  } = useOfflineStorage();

  const [showQuiz, setShowQuiz] = useState(false);

  const video = demoVideos.find(v => v.id === id);
  const quiz = demoQuizzes.find(q => q.contentId === id);
  const progress = getProgress(id || '');
  const bestQuizScore = quiz ? getBestQuizScore(quiz.id) : undefined;

  if (!video) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Video not found</p>
        <Button variant="link" onClick={() => navigate('/videos')}>
          Back to Videos
        </Button>
      </div>
    );
  }

  const downloaded = isDownloaded(video.id);
  const canWatch = downloaded || isOnline;
  const canTakeQuiz = progress?.completed || false;

  const handleProgress = (percent: number, currentTime: number) => {
    updateProgress(video.id, 'video', {
      progress: Math.round(percent),
      lastPosition: currentTime,
    });
  };

  const handleComplete = () => {
    markCompleted(video.id, 'video');
  };

  const handleQuizComplete = (score: number, passed: boolean, answers: number[]) => {
    if (quiz) {
      saveQuizAttempt({
        quizId: quiz.id,
        answers,
        score,
        passed,
      });

      if (passed) {
        updateProgress(video.id, 'video', {
          quizCompleted: true,
          quizScore: score,
        });
      }
    }
  };

  if (showQuiz && quiz) {
    return (
      <div className="max-w-2xl mx-auto py-8 animate-fade-in">
        <Button
          variant="ghost"
          onClick={() => setShowQuiz(false)}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Video
        </Button>
        <QuizPlayer
          quiz={quiz}
          onComplete={handleQuizComplete}
          onClose={() => setShowQuiz(false)}
          bestScore={bestQuizScore}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back button */}
      <Button variant="ghost" onClick={() => navigate('/videos')}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Videos
      </Button>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-4">
          {/* Video Player */}
          {canWatch ? (
            <VideoPlayer
              src={video.videoUrl}
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

          {/* Video Info */}
          <div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-sm font-medium text-primary">
                  {video.subject} • {video.topic}
                </span>
                <h1 className="text-heading text-foreground mt-1">
                  {video.title}
                </h1>
              </div>
              <OfflineStatusBadge 
                status={downloaded ? 'offline-ready' : 'not-downloaded'} 
              />
            </div>

            <p className="text-muted-foreground mt-3">
              {video.description}
            </p>

            <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {video.duration}
              </span>
              <span className="flex items-center gap-1">
                <User className="h-4 w-4" />
                {video.instructor}
              </span>
              <span>{video.resolution} • {video.fileSize}</span>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Download Card */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-3">Offline Access</h3>
              <DownloadButton
                isDownloaded={downloaded}
                fileSize={video.fileSize}
                onDownload={() => markAsDownloaded(video.id, 'video')}
                onRemove={() => removeDownload(video.id)}
              />
              <p className="text-xs text-muted-foreground mt-3">
                {downloaded 
                  ? 'This video is available offline' 
                  : 'Download for offline viewing when you have internet'}
              </p>
            </CardContent>
          </Card>

          {/* Progress Card */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-3">Your Progress</h3>
              <div className="flex items-center gap-4">
                <ProgressRing 
                  progress={progress?.progress || 0} 
                  size={64} 
                  strokeWidth={6}
                />
                <div>
                  <p className="font-medium">
                    {progress?.completed ? 'Completed!' : 'In Progress'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {Math.round(progress?.progress || 0)}% watched
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quiz Card */}
          {quiz && (
            <Card className={cn(
              "border-2",
              progress?.quizCompleted ? "border-success/30" : "border-primary/30"
            )}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Quiz
                  </h3>
                  {progress?.quizCompleted && (
                    <span className="text-success flex items-center gap-1 text-sm">
                      <CheckCircle2 className="h-4 w-4" />
                      Passed
                    </span>
                  )}
                </div>

                <p className="text-sm text-muted-foreground mb-4">
                  {quiz.questions.length} questions • {quiz.passingScore}% to pass
                </p>

                {bestQuizScore !== undefined && (
                  <div className="flex items-center gap-2 mb-4 text-sm">
                    <Trophy className="h-4 w-4 text-accent" />
                    <span>Best score: {bestQuizScore}%</span>
                  </div>
                )}

                <Button
                  className="w-full"
                  disabled={!canTakeQuiz}
                  onClick={() => setShowQuiz(true)}
                >
                  {progress?.quizCompleted 
                    ? 'Retake Quiz' 
                    : canTakeQuiz 
                      ? 'Take Quiz' 
                      : 'Complete video first'}
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
