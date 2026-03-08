import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { useHodDepartment } from '@/hooks/use-hod';
import { HodLayout } from '@/components/hod/HodLayout';
import { CreateSchedule } from '@/components/hod/CreateSchedule';
import { Skeleton } from '@/components/ui/skeleton';

export default function HodSchedulePage() {
  const navigate = useNavigate();
  const { user, isHod, isLoading: authLoading } = useAuthContext();
  const { departmentId, isLoading: deptLoading } = useHodDepartment();

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth?redirect=/hod/schedule');
    if (!authLoading && !isHod) navigate('/');
  }, [authLoading, isHod, user, navigate]);

  if (authLoading || deptLoading) return <HodLayout><Skeleton className="h-64" /></HodLayout>;
  if (!isHod) return <HodLayout><div className="text-center py-12"><p className="text-muted-foreground">You do not have HOD access.</p></div></HodLayout>;
  if (!departmentId) return <HodLayout><div className="text-center py-12"><p className="text-muted-foreground">No department assigned. Contact an administrator.</p></div></HodLayout>;

  return (
    <HodLayout>
      <CreateSchedule departmentId={departmentId} />
    </HodLayout>
  );
}
