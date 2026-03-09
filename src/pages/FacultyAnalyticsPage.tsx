import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { FacultyLayout } from '@/components/faculty/FacultyLayout';
import { VideoAnalyticsDashboard } from '@/components/faculty/VideoAnalyticsDashboard';
import { Skeleton } from '@/components/ui/skeleton';

export default function FacultyAnalyticsPage() {
  const navigate = useNavigate();
  const { user, isFaculty, isLoading: authLoading } = useAuthContext();

  useEffect(() => {
    if (!authLoading && !user) { navigate('/auth?redirect=/faculty/analytics'); return; }
    if (!authLoading && !isFaculty) navigate('/');
  }, [authLoading, isFaculty, user, navigate]);

  if (authLoading) return <FacultyLayout><Skeleton className="h-64 w-full" /></FacultyLayout>;
  if (!isFaculty) return null;

  return (
    <FacultyLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Video Engagement Analytics</h1>
          <p className="text-muted-foreground">AI-powered insights on how students watch your videos</p>
        </div>
        <VideoAnalyticsDashboard />
      </div>
    </FacultyLayout>
  );
}
