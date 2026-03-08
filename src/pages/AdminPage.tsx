import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, Users, Video, FileText, BarChart3, MessageSquare, UserPlus, TicketIcon,
  LogOut, Loader2, Trophy, Building2, GraduationCap, Megaphone, UserCog, BookUser
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { AdminUsersByRole } from '@/components/admin/AdminUsersByRole';
import { AdminVideos } from '@/components/admin/AdminVideos';
import { AdminInvites } from '@/components/admin/AdminInvites';
import { AdminRoleInvites } from '@/components/admin/AdminRoleInvites';
import { AdminResources } from '@/components/admin/AdminResources';
import { AdminTickets } from '@/components/admin/AdminTickets';
import { AdminAnalytics } from '@/components/admin/AdminAnalytics';
import { AdminDepartments } from '@/components/admin/AdminDepartments';
import { AdminNotices } from '@/components/admin/AdminNotices';

const AdminPage = () => {
  const navigate = useNavigate();
  const { user, isAdmin, isLoading, signOut } = useAuthContext();
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalVideos: 0,
    totalResources: 0,
    totalDepartments: 0,
    totalClasses: 0,
    totalFaculty: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) navigate('/auth?redirect=/admin');
    else if (!isLoading && user && !isAdmin) navigate('/');
  }, [user, isAdmin, isLoading, navigate]);

  useEffect(() => {
    if (!isAdmin) return;
    const fetchStats = async () => {
      try {
        const [students, videos, resources, depts, cls, facultyRoles] = await Promise.all([
          supabase.from('profiles').select('id', { count: 'exact', head: true }),
          supabase.from('videos').select('id', { count: 'exact', head: true }),
          supabase.from('resources').select('id', { count: 'exact', head: true }),
          (supabase as any).from('departments').select('id', { count: 'exact', head: true }),
          (supabase as any).from('classes').select('id', { count: 'exact', head: true }),
          (supabase as any).from('user_roles').select('id', { count: 'exact', head: true }).eq('role', 'faculty'),
        ]);
        setStats({
          totalStudents: students.count || 0,
          totalVideos: videos.count || 0,
          totalResources: resources.count || 0,
          totalDepartments: depts.count || 0,
          totalClasses: cls.count || 0,
          totalFaculty: facultyRoles.count || 0,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoadingStats(false);
      }
    };
    fetchStats();
  }, [isAdmin]);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }
  if (!isAdmin) return null;

  const statCards = [
    { icon: Users, label: 'Users', value: stats.totalStudents },
    { icon: Building2, label: 'Departments', value: stats.totalDepartments },
    { icon: GraduationCap, label: 'Classes', value: stats.totalClasses },
    { icon: Trophy, label: 'Faculty', value: stats.totalFaculty },
    { icon: Video, label: 'Videos', value: stats.totalVideos },
    { icon: FileText, label: 'Resources', value: stats.totalResources },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10"><Shield className="h-5 w-5 text-primary" /></div>
            <div>
              <h1 className="font-semibold">Admin Dashboard</h1>
              <p className="text-xs text-muted-foreground">CampusHub ERP Management</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:block">{user?.email}</span>
            <Button variant="outline" size="sm" onClick={async () => { await signOut(); navigate('/'); }}>
              <LogOut className="h-4 w-4 mr-2" />Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {statCards.map(({ icon: Icon, label, value }) => (
            <Card key={label}>
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-md bg-primary/10"><Icon className="h-4 w-4 text-primary" /></div>
                  <div>
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="text-lg font-bold text-foreground">
                      {loadingStats ? <Loader2 className="h-4 w-4 animate-spin" /> : value}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="departments" className="space-y-4">
          <TabsList className="flex flex-wrap h-auto gap-1">
            <TabsTrigger value="departments" className="gap-1.5 text-xs sm:text-sm">
              <Building2 className="h-3.5 w-3.5" /><span className="hidden sm:inline">Departments</span><span className="sm:hidden">Depts</span>
            </TabsTrigger>
            <TabsTrigger value="role-invites" className="gap-1.5 text-xs sm:text-sm">
              <UserPlus className="h-3.5 w-3.5" /><span className="hidden sm:inline">Role Invites</span><span className="sm:hidden">Invites</span>
            </TabsTrigger>
            <TabsTrigger value="students" className="gap-1.5 text-xs sm:text-sm">
              <Users className="h-3.5 w-3.5" /><span className="hidden sm:inline">Students</span><span className="sm:hidden">Users</span>
            </TabsTrigger>
            <TabsTrigger value="videos" className="gap-1.5 text-xs sm:text-sm">
              <Video className="h-3.5 w-3.5" /><span className="hidden sm:inline">Videos</span>
            </TabsTrigger>
            <TabsTrigger value="resources" className="gap-1.5 text-xs sm:text-sm">
              <FileText className="h-3.5 w-3.5" /><span className="hidden sm:inline">Resources</span>
            </TabsTrigger>
            <TabsTrigger value="tickets" className="gap-1.5 text-xs sm:text-sm">
              <TicketIcon className="h-3.5 w-3.5" /><span className="hidden sm:inline">Tickets</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-1.5 text-xs sm:text-sm">
              <BarChart3 className="h-3.5 w-3.5" /><span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="notices" className="gap-1.5 text-xs sm:text-sm">
              <Megaphone className="h-3.5 w-3.5" /><span className="hidden sm:inline">Notices</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="departments"><AdminDepartments /></TabsContent>
          <TabsContent value="role-invites"><AdminRoleInvites /></TabsContent>
          <TabsContent value="students"><AdminStudents /></TabsContent>
          <TabsContent value="videos"><AdminVideos /></TabsContent>
          <TabsContent value="resources"><AdminResources /></TabsContent>
          <TabsContent value="tickets"><AdminTickets /></TabsContent>
          <TabsContent value="analytics"><AdminAnalytics /></TabsContent>
          <TabsContent value="notices"><AdminNotices /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminPage;
