import { useState, useEffect } from 'react';
import { UserPlus, Mail, Copy, Check, Clock, Loader2, Send, AlertTriangle, Building2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { RoleInvite } from '@/lib/supabase';

interface UserWithMissingDept {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string;
  department_id: string | null;
}

export function AdminRoleInvites() {
  const { toast } = useToast();
  const [invites, setInvites] = useState<RoleInvite[]>([]);
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'hod' | 'faculty'>('faculty');
  const [departmentId, setDepartmentId] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [usersNeedingDept, setUsersNeedingDept] = useState<UserWithMissingDept[]>([]);
  const [assigningDept, setAssigningDept] = useState<Record<string, string>>({});
  const [savingDept, setSavingDept] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [inviteRes, deptRes] = await Promise.all([
        supabase.functions.invoke('role-invite', { body: { action: 'list' } }),
        (supabase as any).from('departments').select('id, name').order('name'),
      ]);

      setInvites(inviteRes.data?.invites || []);
      setDepartments(deptRes.data || []);

      // Fetch HODs/Faculty missing department
      const { data: roles } = await (supabase as any)
        .from('user_roles')
        .select('user_id, role')
        .in('role', ['hod', 'faculty']);

      if (roles && roles.length > 0) {
        const userIds = roles.map((r: any) => r.user_id);
        const { data: profiles } = await (supabase as any)
          .from('profiles')
          .select('id, full_name, email, department_id')
          .in('id', userIds);

        const roleMap: Record<string, string> = {};
        roles.forEach((r: any) => { roleMap[r.user_id] = r.role; });

        const missing = (profiles || [])
          .filter((p: any) => !p.department_id)
          .map((p: any) => ({ ...p, role: roleMap[p.id] || 'unknown' }));

        setUsersNeedingDept(missing);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const assignDepartment = async (userId: string) => {
    const deptId = assigningDept[userId];
    if (!deptId) {
      toast({ title: 'Select a department first', variant: 'destructive' });
      return;
    }
    setSavingDept(userId);
    try {
      const { error } = await (supabase as any)
        .from('profiles')
        .update({ department_id: deptId })
        .eq('id', userId);
      if (error) throw error;
      toast({ title: 'Department assigned successfully!' });
      setUsersNeedingDept(prev => prev.filter(u => u.id !== userId));
    } catch (err: any) {
      toast({ title: 'Failed to assign', description: err.message, variant: 'destructive' });
    } finally {
      setSavingDept(null);
    }
  };

  const sendInvite = async () => {
    if (!email?.includes('@')) {
      toast({ title: 'Invalid email', variant: 'destructive' });
      return;
    }
    if (!departmentId) {
      toast({ title: 'Please select a department', variant: 'destructive' });
      return;
    }

    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('role-invite', {
        body: { action: 'create', email, role, departmentId },
      });

      if (error) throw error;
      if (data?.error) {
        toast({ title: 'Error', description: data.error, variant: 'destructive' });
        return;
      }

      toast({ title: 'Invite created!', description: `Invite sent for ${email} as ${role}` });
      setEmail('');
      fetchData();
    } catch (error: any) {
      toast({ title: 'Failed', description: error.message, variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  const copyInviteLink = (invite: RoleInvite) => {
    const link = `${window.location.origin}/accept-invite?token=${invite.invite_token}`;
    navigator.clipboard.writeText(link);
    setCopiedId(invite.id);
    setTimeout(() => setCopiedId(null), 2000);
    toast({ title: 'Link copied!' });
  };

  const isExpired = (d: string) => new Date(d) < new Date();

  if (loading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Missing Department Alert */}
      {usersNeedingDept.length > 0 && (
        <Card className="border-warning/50 bg-warning/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-warning">
              <AlertTriangle className="h-5 w-5" /> Users Missing Department
            </CardTitle>
            <CardDescription>These HODs/Faculty accepted their invite but don't have a department assigned. Assign one manually.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {usersNeedingDept.map(user => (
              <div key={user.id} className="flex items-center justify-between gap-3 p-3 border rounded-lg bg-background">
                <div className="flex items-center gap-3 min-w-0">
                  <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{user.full_name || 'Unnamed'}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <Badge variant="secondary" className="text-xs shrink-0">{user.role}</Badge>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Select
                    value={assigningDept[user.id] || ''}
                    onValueChange={v => setAssigningDept(prev => ({ ...prev, [user.id]: v }))}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map(d => (
                        <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button size="sm" onClick={() => assignDepartment(user.id)} disabled={savingDept === user.id}>
                    {savingDept === user.id ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Assign'}
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><UserPlus className="h-5 w-5" /> Invite HOD / Faculty</CardTitle>
          <CardDescription>Send role-based invitations with department assignment</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="space-y-1.5">
              <Label>Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="pl-10" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={role} onValueChange={(v: any) => setRole(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="hod">HOD</SelectItem>
                  <SelectItem value="faculty">Faculty</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Department</Label>
              <Select value={departmentId} onValueChange={setDepartmentId}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {departments.map(d => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="invisible">Action</Label>
              <Button onClick={sendInvite} disabled={sending} className="w-full">
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-4 w-4 mr-2" />Send</>}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>All Invites</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {invites.map(invite => (
              <div key={invite.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{invite.email}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Badge variant="secondary" className="text-xs">{invite.role}</Badge>
                      <Clock className="h-3 w-3" />
                      <span>Expires: {new Date(invite.expires_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {invite.accepted ? (
                    <Badge className="bg-emerald-500 text-emerald-50">Accepted</Badge>
                  ) : isExpired(invite.expires_at) ? (
                    <Badge variant="destructive">Expired</Badge>
                  ) : (
                    <Badge variant="outline">Pending</Badge>
                  )}
                  {!invite.accepted && !isExpired(invite.expires_at) && (
                    <Button variant="outline" size="sm" onClick={() => copyInviteLink(invite)}>
                      {copiedId === invite.id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {invites.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No invites sent yet</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
