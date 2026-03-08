import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { FacultyLayout } from '@/components/faculty/FacultyLayout';
import { FacultyVideos } from '@/components/faculty/FacultyVideos';
import { Skeleton } from '@/components/ui/skeleton';

export default function FacultyVideosPage() {
  const navigate = useNavigate();
  const { user, isFaculty, isLoading: authLoading } = useAuthContext();

  useEffect(() => {
    if (!authLoading && !user) { navigate('/auth?redirect=/faculty/videos'); return; }
    if (!authLoading && !isFaculty) navigate('/');
  }, [authLoading, isFaculty, user, navigate]);

  if (authLoading) return <FacultyLayout><Skeleton className="h-64 w-full" /></FacultyLayout>;
  if (!isFaculty) return null;

  return (
    <FacultyLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Subject Videos</h1>
          <p className="text-muted-foreground">Upload videos for your assigned subjects</p>
        </div>
        <FacultyVideos />
      </div>
    </FacultyLayout>
  );
}
