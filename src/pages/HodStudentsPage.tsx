import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { useHodDepartment, useDepartmentClasses } from '@/hooks/use-hod';
import { HodLayout } from '@/components/hod/HodLayout';
import { ManageStudents } from '@/components/hod/ManageStudents';
import { Skeleton } from '@/components/ui/skeleton';

export default function HodStudentsPage() {
  const navigate = useNavigate();
  const { user, isHod, isLoading: authLoading } = useAuthContext();
  const { departmentId, departmentName, isLoading: deptLoading } = useHodDepartment();

  useEffect(() => {
    if (!authLoading && !user) { navigate('/auth?redirect=/hod/students'); return; }
    if (!authLoading && !isHod) navigate('/');
  }, [authLoading, isHod, user, navigate]);

  const isReady = !authLoading && !deptLoading;

  if (!isReady) {
    return <HodLayout><Skeleton className="h-64 w-full" /></HodLayout>;
  }
  if (!isHod) return <HodLayout><div className="text-center py-12"><p className="text-muted-foreground">You do not have HOD access.</p></div></HodLayout>;
  if (!departmentId) return <HodLayout><div className="text-center py-12"><p className="text-muted-foreground">No department assigned. Contact an administrator.</p></div></HodLayout>;

  return (
    <HodLayout>
      <ManageStudents departmentId={departmentId} departmentName={departmentName} />
    </HodLayout>
  );
}
