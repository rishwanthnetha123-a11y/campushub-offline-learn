import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { useHodDepartment } from '@/hooks/use-hod';
import { HodLayout } from '@/components/hod/HodLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Building2 } from 'lucide-react';

export default function HodDashboardPage() {
  const navigate = useNavigate();
  const { user, isHod, isLoading: authLoading } = useAuthContext();
  const { departmentName, isLoading: deptLoading } = useHodDepartment();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth?redirect=/hod');
      return;
    }
    if (!authLoading && !isHod) {
      navigate('/');
    }
  }, [authLoading, isHod, user, navigate]);

  if (authLoading || deptLoading) {
    return (
      <HodLayout>
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-32" />
        </div>
      </HodLayout>
    );
  }

  if (!isHod) return null;

  return (
    <HodLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">HOD Dashboard</h1>
          <div className="flex items-center gap-2 mt-1">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <Badge variant="secondary">{departmentName || 'No department'}</Badge>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Welcome</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Use the sidebar to manage subjects, assign faculty, create schedules, and view department analytics.
            </p>
          </CardContent>
        </Card>
      </div>
    </HodLayout>
  );
}
