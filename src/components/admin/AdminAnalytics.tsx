import { useEffect, useState } from 'react';
import {
  BarChart3, TrendingUp, TrendingDown, Users, AlertTriangle,
  BookOpen, Video, Loader2, RefreshCw, Brain
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAdminAnalytics, type AdminAnalyticsData } from '@/hooks/use-ai-learning';
import { cn } from '@/lib/utils';

export function AdminAnalytics() {
  const { analytics, loading, error, fetchAnalytics } = useAdminAnalytics();

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-3" />
          <p className="text-destructive">{error}</p>
          <Button onClick={fetchAnalytics} variant="outline" className="mt-4 gap-2">
            <RefreshCw className="h-4 w-4" />Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!analytics) return null;

  const { difficultTopics, subjectAnalytics, inactiveStudents, completionTrend, dropOffs, summary } = analytics;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10"><Users className="h-5 w-5 text-primary" /></div>
              <div>
                <p className="text-2xl font-bold">{summary.activeStudents}<span className="text-sm text-muted-foreground font-normal">/{summary.totalStudents}</span></p>
                <p className="text-xs text-muted-foreground">Active Students (7d)</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/10"><BookOpen className="h-5 w-5 text-accent" /></div>
              <div>
                <p className="text-2xl font-bold">{summary.totalQuizAttempts}</p>
                <p className="text-xs text-muted-foreground">Quiz Attempts</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10"><TrendingUp className="h-5 w-5 text-success" /></div>
              <div>
                <p className="text-2xl font-bold">{summary.avgQuizScore}%</p>
                <p className="text-xs text-muted-foreground">Avg Quiz Score</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10"><AlertTriangle className="h-5 w-5 text-destructive" /></div>
              <div>
                <p className="text-2xl font-bold">{inactiveStudents.length}</p>
                <p className="text-xs text-muted-foreground">Inactive Students</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subject Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" />Subject Performance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {subjectAnalytics.map((subject) => (
            <div key={subject.subject} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">{subject.subject}</span>
                <div className="flex items-center gap-3 text-sm">
                  <span>Score: <strong>{subject.avgScore}%</strong></span>
                  <span>Completion: <strong>{subject.completionRate}%</strong></span>
                </div>
              </div>
              <div className="flex gap-2">
                <Progress value={subject.avgScore} className="h-2 flex-1" />
                <Progress value={subject.completionRate} className="h-2 flex-1 [&>div]:bg-success" />
              </div>
              <p className="text-xs text-muted-foreground">
                {subject.totalVideos} videos • {subject.quizAttempts} quiz attempts
              </p>
            </div>
          ))}
          {subjectAnalytics.length === 0 && (
            <p className="text-center text-muted-foreground py-4">No subject data yet</p>
          )}
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Difficult Topics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-destructive" />Most Difficult Topics
            </CardTitle>
            <CardDescription>Lowest average quiz scores</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {difficultTopics.map((topic, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div>
                  <p className="font-medium text-sm">{topic.topic}</p>
                  <p className="text-xs text-muted-foreground">{topic.subject} • {topic.attempts} attempts</p>
                </div>
                <Badge variant={topic.avgScore < 50 ? "destructive" : "outline"}>
                  {topic.avgScore}%
                </Badge>
              </div>
            ))}
            {difficultTopics.length === 0 && (
              <p className="text-center text-muted-foreground py-4">No quiz data yet</p>
            )}
          </CardContent>
        </Card>

        {/* Inactive Students */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />Inactive Students
            </CardTitle>
            <CardDescription>No activity in 7+ days</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 max-h-80 overflow-y-auto">
            {inactiveStudents.slice(0, 15).map((student) => (
              <div key={student.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50 text-sm">
                <div>
                  <p className="font-medium">{student.name}</p>
                  <p className="text-xs text-muted-foreground">{student.email}</p>
                </div>
                <span className="text-xs text-muted-foreground">
                  Joined {new Date(student.joinedAt).toLocaleDateString()}
                </span>
              </div>
            ))}
            {inactiveStudents.length === 0 && (
              <p className="text-center text-success py-4">All students are active! 🎉</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Drop-off Analysis */}
      {dropOffs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-warning" />Video Drop-off Points
            </CardTitle>
            <CardDescription>Where students stop watching</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {dropOffs.map((item, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div>
                  <p className="font-medium text-sm">{item.video}</p>
                  <p className="text-xs text-muted-foreground">{item.studentCount} students dropped off</p>
                </div>
                <Badge variant="outline">
                  Avg: {Math.floor(item.avgDropOffSeconds / 60)}:{String(item.avgDropOffSeconds % 60).padStart(2, '0')}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Completion Trend */}
      {completionTrend.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-success" />Completion Trend (30 days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-1 h-32">
              {completionTrend.map((day, i) => {
                const maxCompletions = Math.max(...completionTrend.map(d => d.completions));
                const height = maxCompletions > 0 ? (day.completions / maxCompletions) * 100 : 0;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1" title={`${day.date}: ${day.completions}`}>
                    <span className="text-[10px] text-muted-foreground">{day.completions}</span>
                    <div className="w-full bg-primary/80 rounded-t" style={{ height: `${Math.max(height, 4)}%` }} />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Button onClick={fetchAnalytics} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />Refresh Analytics
        </Button>
      </div>
    </div>
  );
}
