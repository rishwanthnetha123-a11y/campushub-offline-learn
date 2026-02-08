import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, 
  Video, 
  FileText, 
  Trophy, 
  Download,
  GraduationCap,
  Menu,
  X,
  MessageSquare,
  Shield,
  LogIn,
  LogOut,
  User
} from 'lucide-react';
import { useState } from 'react';
import { ConnectionStatus } from './ConnectionStatus';
import { Button } from './ui/button';
import { useAuthContext } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/videos', label: 'Videos', icon: Video },
  { path: '/resources', label: 'Resources', icon: FileText },
  { path: '/ask', label: 'Ask AI', icon: MessageSquare },
  { path: '/progress', label: 'My Progress', icon: Trophy },
  { path: '/downloads', label: 'Downloads', icon: Download },
];

export const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin, signOut, isLoading } = useAuthContext();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <GraduationCap className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-foreground">CampusHub</h1>
              <p className="text-xs text-muted-foreground -mt-0.5">Offline Learning</p>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
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

          {/* Right section */}
          <div className="flex items-center gap-3">
            <ConnectionStatus />
            
            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-muted"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {isMobileMenuOpen && (
          <nav className="md:hidden border-t bg-card animate-slide-in">
            <div className="container mx-auto px-4 py-2">
              {navItems.map(({ path, label, icon: Icon }) => (
                <Link
                  key={path}
                  to={path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors touch-target",
                    location.pathname === path
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {label}
                </Link>
              ))}
            </div>
          </nav>
        )}
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/50 mt-auto">
        <div className="container mx-auto px-4 py-4 text-center text-sm text-muted-foreground">
          <p>CampusHub - Offline-First Education for Rural Learners</p>
          <p className="text-xs mt-1">Low-bandwidth optimized • Works without internet</p>
        </div>
      </footer>
    </div>
  );
};
