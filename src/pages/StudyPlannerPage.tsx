import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  CalendarDays, Sparkles, Loader2, CheckCircle2, 
  Video, BookOpen, FileText, Coffee, Clock, AlertCircle, Play, ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useStudyPlanner } from '@/hooks/use-ai-learning';
import { useAuthContext } from '@/contexts/AuthContext';
import { useOfflineStorage } from '@/hooks/use-offline-storage';
import { cn } from '@/lib/utils';

const taskIcons: Record<string, any> = {
  watch_video: Video,
  take_quiz: BookOpen,
  review_notes: FileText,
  practice: BookOpen,
  rest: Coffee,
};

const priorityColors: Record<string, string> = {
  high: 'bg-destructive/10 text-destructive border-destructive/20',
  medium: 'bg-warning/10 text-warning border-warning/20',
  low: 'bg-success/10 text-success border-success/20',
};

const StudyPlannerPage = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuthContext();
  const { plan, loading, error, generatePlan, toggleTaskComplete } = useStudyPlanner();
  const { getProgress, isDownloaded, isOnline } = useOfflineStorage();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth?redirect=/study-plan');
    }
  }, [user, authLoading, navigate]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const totalTasks = plan?.days?.reduce((t, d) => t + d.tasks.filter(tk => tk.type !== 'rest').length, 0) || 0;
  const completedTasks = plan?.days?.reduce((t, d) => t + d.tasks.filter(tk => tk.completed).length, 0) || 0;
  const completionPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const handleStartLearning = (videoId: string) => {
    navigate(`/video/${videoId}`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-heading text-foreground flex items-center gap-2">
            <CalendarDays className="h-6 w-6 text-primary" />
            AI Study Planner
          </h1>
          <p className="text-muted-foreground">Your personalized weekly study schedule</p>
        </div>
        <Button onClick={generatePlan} disabled={loading} className="gap-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {plan ? 'Regenerate' : 'Generate Plan'}
        </Button>
      </div>

      {error && (
        <Card className="border-destructive/50">
          <CardContent className="pt-6 flex items-center gap-3 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <p>{error}</p>
          </CardContent>
        </Card>
      )}

      {!plan && !loading && (
        <Card>
          <CardContent className="py-16 text-center">
            <Sparkles className="h-16 w-16 text-primary/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Study Plan Yet</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              AI will analyze your progress, quiz scores, and pending content to create a personalized weekly study plan.
            </p>
            <Button onClick={generatePlan} disabled={loading} size="lg" className="gap-2">
              <Sparkles className="h-5 w-5" />
              Generate My Plan
            </Button>
          </CardContent>
        </Card>
      )}

      {plan && (
        <>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-semibold">Weekly Progress</p>
                  <p className="text-sm text-muted-foreground">{plan.weekly_goal}</p>
                </div>
                <span className="text-2xl font-bold text-primary">{completionPercent}%</span>
              </div>
              <Progress value={completionPercent} className="h-3" />
              <div className="flex items-center justify-between mt-2 text-sm text-muted-foreground">
                <span>{completedTasks} of {totalTasks} tasks done</span>
                {plan.focus_subjects?.length > 0 && (
                  <span>Focus: {plan.focus_subjects.join(', ')}</span>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {plan.days?.map((day, dayIndex) => {
              const dayCompleted = day.tasks.every(t => t.completed || t.type === 'rest');
              const today = day.date_offset === 0;

              return (
                <Card key={dayIndex} className={cn(
                  today && "ring-2 ring-primary/30",
                  dayCompleted && "opacity-75"
                )}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        {day.day}
                        {today && <Badge className="bg-primary text-primary-foreground text-xs">Today</Badge>}
                        {dayCompleted && <CheckCircle2 className="h-4 w-4 text-success" />}
                      </CardTitle>
                      <span className="text-sm text-muted-foreground">
                        {day.tasks.reduce((t, tk) => t + (tk.duration_minutes || 0), 0)} min total
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {day.tasks.map((task, taskIndex) => {
                      const Icon = taskIcons[task.type] || BookOpen;
                      const isRest = task.type === 'rest';
                      const videoProgress = task.video_id ? getProgress(task.video_id) : undefined;
                      const hasLocalCopy = task.video_id ? isDownloaded(task.video_id) : false;
                      const canNavigate = task.video_id && (isOnline || hasLocalCopy);

                      return (
                        <div
                          key={taskIndex}
                          className={cn(
                            "rounded-lg border transition-all overflow-hidden",
                            task.completed ? "bg-success/5 border-success/20" : "hover:bg-muted/50",
                            isRest && "bg-muted/30"
                          )}
                        >
                          <div className="flex items-start gap-3 p-3">
                            {/* Thumbnail for video tasks */}
                            {task.video_id && task.video_thumbnail && (
                              <div className="relative w-20 h-14 rounded-md overflow-hidden shrink-0 bg-muted">
                                <img
                                  src={task.video_thumbnail}
                                  alt={task.video_title || task.title}
                                  className="w-full h-full object-cover"
                                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                />
                                {videoProgress && (
                                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted-foreground/20">
                                    <div
                                      className="h-full bg-primary transition-all"
                                      style={{ width: `${videoProgress.progress || 0}%` }}
                                    />
                                  </div>
                                )}
                              </div>
                            )}

                            <button
                              onClick={() => !isRest && toggleTaskComplete(dayIndex, taskIndex)}
                              className={cn(
                                "w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors mt-0.5",
                                task.completed ? "bg-success border-success" : "border-muted-foreground/30 hover:border-primary"
                              )}
                            >
                              {task.completed && <CheckCircle2 className="h-4 w-4 text-success-foreground" />}
                            </button>

                            {!task.video_id && (
                              <Icon className={cn("h-4 w-4 shrink-0 mt-1", task.completed ? "text-success" : "text-muted-foreground")} />
                            )}

                            <div className="flex-1 min-w-0">
                              <p className={cn("text-sm font-medium", task.completed && "line-through text-muted-foreground")}>
                                {task.video_title || task.title}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <p className="text-xs text-muted-foreground">{task.subject}</p>
                                {task.video_duration && (
                                  <span className="text-xs text-muted-foreground">• {task.video_duration}</span>
                                )}
                                {hasLocalCopy && (
                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-success/10 text-success border-success/20">
                                    Offline
                                  </Badge>
                                )}
                              </div>
                              {/* Progress bar for video tasks */}
                              {videoProgress && !task.completed && (
                                <div className="mt-2">
                                  <Progress value={videoProgress.progress || 0} className="h-1.5" />
                                  <p className="text-[10px] text-muted-foreground mt-0.5">
                                    {videoProgress.progress || 0}% watched
                                  </p>
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />{task.duration_minutes}m
                              </span>
                              <Badge variant="outline" className={cn("text-xs", priorityColors[task.priority])}>
                                {task.priority}
                              </Badge>
                            </div>
                          </div>

                          {/* Start Learning button for video tasks */}
                          {task.video_id && !task.completed && (
                            <div className="px-3 pb-3 pt-0">
                              <Button
                                size="sm"
                                className="w-full gap-2"
                                variant={canNavigate ? "default" : "outline"}
                                disabled={!canNavigate}
                                onClick={() => handleStartLearning(task.video_id!)}
                              >
                                {canNavigate ? (
                                  <>
                                    <Play className="h-3.5 w-3.5" />
                                    {videoProgress?.progress ? 'Continue Learning' : 'Start Learning'}
                                  </>
                                ) : (
                                  <>
                                    <ExternalLink className="h-3.5 w-3.5" />
                                    Needs Internet
                                  </>
                                )}
                              </Button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default StudyPlannerPage;
