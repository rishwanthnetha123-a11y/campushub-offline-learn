import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { useHodDepartment } from '@/hooks/use-hod';
import { HodLayout } from '@/components/hod/HodLayout';
import { AssignFaculty } from '@/components/hod/AssignFaculty';
import { Skeleton } from '@/components/ui/skeleton';

export default function HodAssignFacultyPage() {
  const navigate = useNavigate();
  const { user, isHod, isLoading: authLoading } = useAuthContext();
  const { departmentId, isLoading: deptLoading } = useHodDepartment();

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth?redirect=/hod/assign-faculty');
    if (!authLoading && !isHod) navigate('/');
  }, [authLoading, isHod, user, navigate]);

  if (authLoading || deptLoading) return <HodLayout><Skeleton className="h-64" /></HodLayout>;
  if (!isHod || !departmentId) return null;

  return (
    <HodLayout>
      <AssignFaculty departmentId={departmentId} />
    </HodLayout>
  );
}
