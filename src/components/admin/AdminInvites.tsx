import { useState, useEffect } from 'react';
import { 
  UserPlus, 
  Mail, 
  Copy, 
  Check,
  Clock,
  Loader2,
  Send
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase, AdminInvite } from '@/lib/supabase';

export function AdminInvites() {
  const { toast } = useToast();
  const [invites, setInvites] = useState<AdminInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [email, setEmail] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchInvites();
  }, []);

  const fetchInvites = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_invites')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvites(data || []);
    } catch (error) {
      console.error('Error fetching invites:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendInvite = async () => {
    if (!email || !email.includes('@')) {
      toast({
        title: 'Invalid email',
        description: 'Please enter a valid email address.',
        variant: 'destructive',
      });
      return;
    }

    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-invite', {
        body: { action: 'create', email },
      });

      if (error) throw error;

      if (data?.error) {
        toast({
          title: 'Error',
          description: data.error,
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Invite sent!',
        description: `Admin invite created for ${email}`,
      });

      setEmail('');
      fetchInvites();
    } catch (error) {
      console.error('Error sending invite:', error);
      toast({
        title: 'Failed to send invite',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  const copyInviteLink = (invite: AdminInvite) => {
    const link = `${window.location.origin}/auth?invite=${invite.invite_token}`;
    navigator.clipboard.writeText(link);
    setCopiedId(invite.id);
    setTimeout(() => setCopiedId(null), 2000);
    toast({
      title: 'Link copied!',
      description: 'Invite link copied to clipboard.',
    });
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Send New Invite */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Invite New Admin
          </CardTitle>
          <CardDescription>
            Send an invite to grant admin access to another user
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="email" className="sr-only">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Button onClick={sendInvite} disabled={sending}>
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Invite
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Pending Invites */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Invites</CardTitle>
          <CardDescription>
            Invites that are waiting to be accepted
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {invites.filter(i => !i.accepted).map((invite) => (
              <div 
                key={invite.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{invite.email}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>
                        Expires: {new Date(invite.expires_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isExpired(invite.expires_at) ? (
                    <Badge variant="destructive">Expired</Badge>
                  ) : (
                    <Badge variant="outline">Pending</Badge>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyInviteLink(invite)}
                    disabled={isExpired(invite.expires_at)}
                  >
                    {copiedId === invite.id ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))}

            {invites.filter(i => !i.accepted).length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No pending invites
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Accepted Invites */}
      {invites.filter(i => i.accepted).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Accepted Invites</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {invites.filter(i => i.accepted).map((invite) => (
                <div 
                  key={invite.id}
                  className="flex items-center justify-between p-4 border rounded-lg bg-success/5"
                >
                  <div className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-success" />
                    <p className="font-medium">{invite.email}</p>
                  </div>
                  <Badge className="bg-success">Accepted</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
