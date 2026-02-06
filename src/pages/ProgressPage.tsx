import { 
  Trophy, 
  Video, 
  FileText, 
  CheckCircle2,
  Clock,
  BookOpen
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ProgressRing } from '@/components/ProgressRing';
import { useOfflineStorage } from '@/hooks/use-offline-storage';
import { demoVideos, demoResources, demoQuizzes } from '@/data/demo-content';
import { cn } from '@/lib/utils';

const ProgressPage = () => {
  const { progress, quizAttempts, getProgress, getBestQuizScore } = useOfflineStorage();

  // Calculate overall stats
  const totalContent = demoVideos.length + demoResources.length;
  const completedContent = progress.filter(p => p.completed).length;
  const overallProgress = totalContent > 0 ? (completedContent / totalContent) * 100 : 0;

  const totalQuizzes = demoQuizzes.length;
  const passedQuizzes = demoQuizzes.filter(quiz => {
    const best = getBestQuizScore(quiz.id);
    return best !== undefined && best >= quiz.passingScore;
  }).length;

  // Get in-progress content
  const inProgressContent = progress
    .filter(p => !p.completed && p.progress > 0)
    .map(p => {
      const video = demoVideos.find(v => v.id === p.contentId);
      const resource = demoResources.find(r => r.id === p.contentId);
      return {
        ...p,
        content: video || resource,
        type: video ? 'video' : 'resource',
      };
    })
    .filter(p => p.content);

  // Get completed content
  const completedItems = progress
    .filter(p => p.completed)
    .map(p => {
      const video = demoVideos.find(v => v.id === p.contentId);
      const resource = demoResources.find(r => r.id === p.contentId);
      return {
        ...p,
        content: video || resource,
        type: video ? 'video' : 'resource',
      };
    })
    .filter(p => p.content);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-heading text-foreground flex items-center gap-2">
          <Trophy className="h-6 w-6 text-accent" />
          My Learning Progress
        </h1>
        <p className="text-muted-foreground">
          Track your learning journey and achievements
        </p>
      </div>

      {/* Overall Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <ProgressRing progress={overallProgress} size={56} strokeWidth={5} />
              <div>
                <p className="text-2xl font-bold">{Math.round(overallProgress)}%</p>
                <p className="text-sm text-muted-foreground">Overall Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Video className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {progress.filter(p => p.completed && p.contentType === 'video').length}
                  <span className="text-sm text-muted-foreground font-normal">
                    /{demoVideos.length}
                  </span>
                </p>
                <p className="text-sm text-muted-foreground">Videos Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-success/10">
                <FileText className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {progress.filter(p => p.completed && p.contentType === 'resource').length}
                  <span className="text-sm text-muted-foreground font-normal">
                    /{demoResources.length}
                  </span>
                </p>
                <p className="text-sm text-muted-foreground">Resources Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-accent/10">
                <BookOpen className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {passedQuizzes}
                  <span className="text-sm text-muted-foreground font-normal">
                    /{totalQuizzes}
                  </span>
                </p>
                <p className="text-sm text-muted-foreground">Quizzes Passed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* In Progress Section */}
      {inProgressContent.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-warning" />
              Continue Learning
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {inProgressContent.map(item => (
                <Link 
                  key={item.contentId}
                  to={item.type === 'video' ? `/video/${item.contentId}` : `/resource/${item.contentId}`}
                  className="block"
                >
                  <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted transition-colors">
                    <ProgressRing progress={item.progress} size={40} strokeWidth={4} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{item.content?.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.type === 'video' ? 'Video' : 'Resource'} • {item.content?.subject}
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      Continue
                    </Button>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Completed Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-success" />
            Completed ({completedItems.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {completedItems.length === 0 ? (
            <div className="text-center py-8">
              <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No completed content yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Start watching videos or reading resources to track your progress
              </p>
              <Link to="/videos">
                <Button className="mt-4">Start Learning</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {completedItems.map(item => {
                const quiz = demoQuizzes.find(q => q.contentId === item.contentId);
                const quizScore = quiz ? getBestQuizScore(quiz.id) : undefined;

                return (
                  <Link 
                    key={item.contentId}
                    to={item.type === 'video' ? `/video/${item.contentId}` : `/resource/${item.contentId}`}
                    className="block"
                  >
                    <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted transition-colors">
                      <div className="p-2 rounded-full bg-success/10">
                        <CheckCircle2 className="h-5 w-5 text-success" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{item.content?.title}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{item.type === 'video' ? 'Video' : 'Resource'}</span>
                          <span>•</span>
                          <span>{item.content?.subject}</span>
                          {quizScore !== undefined && (
                            <>
                              <span>•</span>
                              <span className="text-accent">Quiz: {quizScore}%</span>
                            </>
                          )}
                        </div>
                      </div>
                      {item.completedAt && (
                        <span className="text-xs text-muted-foreground">
                          {new Date(item.completedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quiz History */}
      {quizAttempts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Quiz History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {quizAttempts.slice(-10).reverse().map(attempt => {
                const quiz = demoQuizzes.find(q => q.id === attempt.quizId);
                
                return (
                  <div 
                    key={attempt.id}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg",
                      attempt.passed ? "bg-success/5" : "bg-destructive/5"
                    )}
                  >
                    <div>
                      <p className="font-medium">{quiz?.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(attempt.completedAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={cn(
                        "font-bold",
                        attempt.passed ? "text-success" : "text-destructive"
                      )}>
                        {attempt.score}%
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {attempt.passed ? 'Passed' : 'Failed'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProgressPage;
