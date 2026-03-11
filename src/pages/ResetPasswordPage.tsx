import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Loader2, Eye, EyeOff, CheckCircle2, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const [done, setDone] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);

  useEffect(() => {
    const hash = window.location.hash;
    
    // Check for error in hash (expired/invalid link)
    if (hash.includes('error=')) {
      const params = new URLSearchParams(hash.replace('#', ''));
      const errorDesc = params.get('error_description') || 'The reset link is invalid or has expired.';
      setLinkError(errorDesc.replace(/\+/g, ' '));
      return;
    }

    // Listen for PASSWORD_RECOVERY event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecovery(true);
      }
    });

    // Check hash for type=recovery
    if (hash.includes('type=recovery')) {
      setIsRecovery(true);
    }

    // Also check if user already has a session (recovery link already processed)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setIsRecovery(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ title: 'Passwords do not match', variant: 'destructive' });
      return;
    }
    if (password.length < 6) {
      toast({ title: 'Password too short', description: 'Minimum 6 characters required.', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      toast({ title: 'Failed to reset password', description: error.message, variant: 'destructive' });
    } else {
      setDone(true);
      toast({ title: 'Password updated!', description: 'You can now sign in with your new password.' });
      setTimeout(() => navigate('/auth'), 2000);
    }
    setIsLoading(false);
  };

  if (linkError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="text-xl text-destructive">Link Expired</CardTitle>
            <CardDescription>{linkError}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/auth')} className="w-full">
              Back to Sign In
            </Button>
            <p className="text-sm text-muted-foreground mt-3">Request a new password reset from the login page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isRecovery && !done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-8 pb-8">
            <p className="text-muted-foreground mb-4">Loading recovery session...</p>
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-primary/10">
              <GraduationCap className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Reset Password</CardTitle>
          <CardDescription>Enter your new password below</CardDescription>
        </CardHeader>
        <CardContent>
          {done ? (
            <div className="text-center space-y-3">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
              <p className="font-medium text-foreground">Password updated successfully!</p>
              <p className="text-sm text-muted-foreground">Redirecting to sign in...</p>
            </div>
          ) : (
            <form onSubmit={handleReset} className="space-y-4">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="New password (min 6 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  minLength={6}
                  required
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10"
                  minLength={6}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Lock className="h-4 w-4 mr-2" />}
                Update Password
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPasswordPage;
