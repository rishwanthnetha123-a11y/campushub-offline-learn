import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, XCircle, UserPlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function AcceptInvitePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isLoading: authLoading, refreshRoles } = useAuthContext();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'ready' | 'accepting' | 'success' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [assignedRole, setAssignedRole] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMsg('No invite token provided');
      return;
    }
    if (authLoading) return;
    if (!user) {
      // Redirect to auth with return to this page
      navigate(`/auth?redirect=/accept-invite?token=${token}`);
      return;
    }
    setStatus('ready');
  }, [token, authLoading, user, navigate]);

  const handleAccept = async () => {
    if (!user || !token) return;
    setStatus('accepting');

    try {
      const { data, error } = await supabase.functions.invoke('role-invite', {
        body: {
          action: 'accept',
          inviteToken: token,
          userId: user.id,
          userEmail: user.email,
        },
      });

      if (error) throw error;
      if (data?.error) {
        setStatus('error');
        setErrorMsg(data.error);
        return;
      }

      setAssignedRole(data.role);
      setStatus('success');
      await refreshRoles();
      toast.success(data.message || 'Role assigned successfully!');
    } catch (err: any) {
      setStatus('error');
      setErrorMsg(err.message || 'Failed to accept invite');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-primary/10">
              <UserPlus className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Accept Invitation</CardTitle>
          <CardDescription>You've been invited to join CampusHub</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'loading' && (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}

          {status === 'ready' && (
            <div className="space-y-4 text-center">
              <p className="text-muted-foreground">
                Signed in as <span className="font-medium text-foreground">{user?.email}</span>
              </p>
              <Button onClick={handleAccept} className="w-full">
                Accept Invitation
              </Button>
            </div>
          )}

          {status === 'accepting' && (
            <div className="flex flex-col items-center gap-3 py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="text-muted-foreground">Processing invitation...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center gap-3 py-4">
              <CheckCircle className="h-12 w-12 text-green-500" />
              <p className="font-medium text-foreground">Invitation accepted!</p>
              <Badge variant="secondary" className="text-sm">{assignedRole.toUpperCase()}</Badge>
              <Button onClick={() => navigate(assignedRole === 'hod' ? '/hod' : '/faculty')} className="mt-4 w-full">
                Go to Dashboard
              </Button>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center gap-3 py-4">
              <XCircle className="h-12 w-12 text-destructive" />
              <p className="font-medium text-destructive">{errorMsg}</p>
              <Button variant="outline" onClick={() => navigate('/')} className="mt-4">
                Go Home
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
