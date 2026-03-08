import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, BookOpen, UserCheck, Calendar, BarChart3, LogOut, ArrowLeft, GraduationCap, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthContext } from '@/contexts/AuthContext';
import campusHubLogo from '@/assets/campus-hub-logo.png';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/hod', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/hod/subjects', label: 'Manage Subjects', icon: BookOpen },
  { path: '/hod/assign-faculty', label: 'Assign Faculty', icon: UserCheck },
  { path: '/hod/students', label: 'Manage Students', icon: GraduationCap },
  { path: '/hod/schedule', label: 'Create Schedule', icon: Calendar },
  { path: '/hod/videos', label: 'Subject Videos', icon: Video },
  { path: '/hod/analytics', label: 'Analytics', icon: BarChart3 },
];

export function HodLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuthContext();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-background flex">
      <aside className="hidden md:flex w-60 flex-col bg-card border-r">
        <div className="p-4 border-b">
          <Link to="/hod" className="flex items-center gap-2">
            <img src={campusHubLogo} alt="CampusHub" className="w-8 h-8 rounded-lg object-contain" />
            <div>
              <h1 className="font-bold text-sm text-foreground">CampusHub</h1>
              <p className="text-xs text-muted-foreground">HOD Portal</p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(({ path, label, icon: Icon }) => (
            <Link
              key={path}
              to={path}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                location.pathname === path
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="p-3 border-t space-y-1">
          <Link to="/" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
          <button onClick={handleSignOut} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted w-full">
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="md:hidden sticky top-0 z-50 bg-card border-b px-4 h-14 flex items-center justify-between">
          <Link to="/hod" className="flex items-center gap-2">
            <img src={campusHubLogo} alt="CampusHub" className="w-8 h-8 rounded-lg object-contain" />
            <span className="font-bold text-sm">HOD Portal</span>
          </Link>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            <LogOut className="h-4 w-4" />
          </Button>
        </header>

        <main className="flex-1 p-4 md:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
