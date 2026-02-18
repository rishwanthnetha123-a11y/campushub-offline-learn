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
import campusHubLogo from '@/assets/campus-hub-logo.png';
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
            <img src={campusHubLogo} alt="CampusHub" className="w-10 h-10 rounded-lg object-contain" />
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
          <div className="flex items-center gap-2">
            <ConnectionStatus />
            
            {/* Admin link for admins */}
            {isAdmin && (
              <Link to="/admin">
                <Button variant="outline" size="sm" className="hidden md:flex gap-2">
                  <Shield className="h-4 w-4" />
                  Admin
                </Button>
              </Link>
            )}
            
            {/* Auth buttons */}
            {!isLoading && (
              user ? (
                <Button variant="ghost" size="sm" onClick={handleSignOut} className="hidden md:flex gap-2">
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </Button>
              ) : (
                <Link to="/auth">
                  <Button variant="outline" size="sm" className="hidden md:flex gap-2">
                    <LogIn className="h-4 w-4" />
                    Sign In
                  </Button>
                </Link>
              )
            )}
            
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
            <div className="container mx-auto px-4 py-2 space-y-1">
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
              
              {/* Admin link in mobile */}
              {isAdmin && (
                <Link
                  to="/admin"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-primary hover:bg-muted"
                >
                  <Shield className="h-5 w-5" />
                  Admin Dashboard
                </Link>
              )}
              
              {/* Auth in mobile */}
              <div className="border-t pt-2 mt-2">
                {user ? (
                  <button
                    onClick={() => {
                      handleSignOut();
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted w-full text-left"
                  >
                    <LogOut className="h-5 w-5" />
                    Sign Out
                  </button>
                ) : (
                  <Link
                    to="/auth"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted"
                  >
                    <LogIn className="h-5 w-5" />
                    Sign In
                  </Link>
                )}
              </div>
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
