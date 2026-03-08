import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { HodLayout } from '@/components/hod/HodLayout';
import { HodVideos } from '@/components/hod/HodVideos';
import { Skeleton } from '@/components/ui/skeleton';

export default function HodVideosPage() {
  const navigate = useNavigate();
  const { user, isHod, isLoading: authLoading } = useAuthContext();

  useEffect(() => {
    if (!authLoading && !user) { navigate('/auth?redirect=/hod/videos'); return; }
    if (!authLoading && !isHod) navigate('/');
  }, [authLoading, isHod, user, navigate]);

  if (authLoading) return <HodLayout><Skeleton className="h-64 w-full" /></HodLayout>;
  if (!isHod) return null;

  return (
    <HodLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Subject Videos</h1>
          <p className="text-muted-foreground">Upload and manage videos for your department subjects</p>
        </div>
        <HodVideos />
      </div>
    </HodLayout>
  );
}
