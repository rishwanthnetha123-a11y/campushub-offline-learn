import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Trash2, Loader2, Users } from 'lucide-react';

interface UserProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  department_name: string | null;
  class_label: string | null;
  roll_no: string | null;
  phone: string | null;
}

interface Props {
  role: 'student' | 'faculty' | 'hod' | 'admin';
  title: string;
  description: string;
}

export function AdminUsersByRole({ role, title, description }: Props) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => { fetchUsers(); }, [role]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Get user IDs with this role
      const { data: roleData } = await (supabase as any)
        .from('user_roles')
        .select('user_id')
        .eq('role', role);

      if (!roleData || roleData.length === 0) {
        setUsers([]);
        setLoading(false);
        return;
      }

      const userIds = roleData.map((r: any) => r.user_id);

      const { data: profiles } = await (supabase as any)
        .from('profiles')
        .select('id, full_name, email, roll_no, phone, department_id, class_id, departments:department_id(name), classes:class_id(year, section)')
        .in('id', userIds)
        .order('full_name');

      const mapped = (profiles || []).map((p: any) => ({
        id: p.id,
        full_name: p.full_name,
        email: p.email,
        roll_no: p.roll_no,
        phone: p.phone,
        department_name: p.departments?.name || null,
        class_label: p.classes ? `Year ${p.classes.year} - ${p.classes.section}` : null,
      }));

      setUsers(mapped);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (userId: string) => {
    setDeleting(userId);
    try {
      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: { user_id: userId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setUsers(prev => prev.filter(u => u.id !== userId));
      toast.success('User deleted permanently');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete user');
    } finally {
      setDeleting(null);
    }
  };

  const filtered = users.filter(u =>
    u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.roll_no?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-12" />)}</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription>{users.length} {description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or roll no..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No {role}s found</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">#</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  {role === 'student' && <TableHead>Roll No</TableHead>}
                  <TableHead>Department</TableHead>
                  {role === 'student' && <TableHead>Class</TableHead>}
                  {role !== 'admin' && <TableHead className="w-16">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((user, idx) => (
                  <TableRow key={user.id}>
                    <TableCell className="text-muted-foreground font-mono text-xs">{idx + 1}</TableCell>
                    <TableCell className="font-medium">{user.full_name || '—'}</TableCell>
                    <TableCell className="text-sm">{user.email || '—'}</TableCell>
                    {role === 'student' && <TableCell className="font-mono text-sm">{user.roll_no || '—'}</TableCell>}
                    <TableCell>
                      {user.department_name ? (
                        <Badge variant="outline">{user.department_name}</Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">Not assigned</span>
                      )}
                    </TableCell>
                    {role === 'student' && (
                      <TableCell className="text-sm">{user.class_label || '—'}</TableCell>
                    )}
                    {role !== 'admin' && (
                      <TableCell>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                              {deleting === user.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete User Permanently?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete <strong>{user.full_name || user.email}</strong> and all their data. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => handleDelete(user.id)}>Delete Permanently</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
