import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, Video, FileText, Trophy, Download, Menu, X, MessageSquare, 
  Shield, LogIn, LogOut, TicketIcon, Globe, CalendarDays, GraduationCap, Building2, UserCircle,
  Sun, Moon
} from 'lucide-react';
import { useState } from 'react';
import { useTheme } from 'next-themes';
import { ConnectionStatus } from './ConnectionStatus';
import { Button } from './ui/button';
import { useAuthContext } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { CONTENT_LANGUAGES, ContentLanguageCode } from '@/lib/languages';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import campusHubLogo from '@/assets/campus-hub-logo.png';
import { cn } from '@/lib/utils';

export const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin, isHod, isFaculty, signOut, isLoading } = useAuthContext();
  const { language, setLanguage, t } = useLanguage();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { path: '/', label: t.nav_home, icon: Home },
    { path: '/videos', label: t.nav_videos, icon: Video },
    { path: '/resources', label: t.nav_resources, icon: FileText },
    { path: '/ask', label: t.nav_ask_ai, icon: MessageSquare },
    { path: '/study-plan', label: 'Study Plan', icon: CalendarDays },
    { path: '/support', label: t.nav_support, icon: TicketIcon },
    { path: '/my-academics', label: 'My Academics', icon: GraduationCap },
    { path: '/progress', label: t.nav_progress, icon: Trophy },
    { path: '/downloads', label: t.nav_downloads, icon: Download },
  ];

  // Bottom nav shows these 5 on mobile
  const mobileNavItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/videos', label: 'Videos', icon: Video },
    { path: '/ask', label: 'AI Tutor', icon: MessageSquare },
    { path: '/my-academics', label: 'Academics', icon: GraduationCap },
    { path: '/profile', label: 'Profile', icon: UserCircle },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header - Glass effect */}
      <header className="sticky top-0 z-50 glass-header">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="relative">
              <img src={campusHubLogo} alt="CampusHub" className="w-10 h-10 rounded-xl object-contain transition-transform group-hover:scale-105" />
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-success border-2 border-card" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-foreground tracking-tight">CampusHub</h1>
              <p className="text-[10px] text-muted-foreground -mt-0.5 font-medium uppercase tracking-wider">Offline Learning</p>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-0.5">
            {navItems.map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                  location.pathname === path
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {/* Language Selector */}
            <Select value={language} onValueChange={(v) => setLanguage(v as ContentLanguageCode)}>
              <SelectTrigger className="w-[110px] h-9 text-xs border-none bg-muted/50 hover:bg-muted transition-colors">
                <Globe className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONTENT_LANGUAGES.map(lang => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {lang.nativeName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <ConnectionStatus />

            {isHod && (
              <Link to="/hod">
                <Button variant="outline" size="sm" className="hidden md:flex gap-2 border-primary/20 text-primary hover:bg-primary/5">
                  <Building2 className="h-4 w-4" />
                  HOD
                </Button>
              </Link>
            )}

            {isFaculty && (
              <Link to="/faculty">
                <Button variant="outline" size="sm" className="hidden md:flex gap-2 border-primary/20 text-primary hover:bg-primary/5">
                  <GraduationCap className="h-4 w-4" />
                  Faculty
                </Button>
              </Link>
            )}

            {isAdmin && (
              <Link to="/admin">
                <Button variant="outline" size="sm" className="hidden md:flex gap-2 border-primary/20 text-primary hover:bg-primary/5">
                  <Shield className="h-4 w-4" />
                  {t.nav_admin}
                </Button>
              </Link>
            )}

            {!isLoading && (
              user ? (
                <>
                  <Link to="/profile">
                    <Button variant="ghost" size="sm" className="hidden md:flex gap-2 hover:bg-primary/5">
                      <div className="w-6 h-6 rounded-full gradient-primary flex items-center justify-center">
                        <UserCircle className="h-4 w-4 text-primary-foreground" />
                      </div>
                      <span className="hidden xl:inline">Profile</span>
                    </Button>
                  </Link>
                  <Button variant="ghost" size="sm" onClick={handleSignOut} className="hidden md:flex gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/5">
                    <LogOut className="h-4 w-4" />
                    <span className="hidden xl:inline">{t.nav_sign_out}</span>
                  </Button>
                </>
              ) : (
                <Link to="/auth">
                  <Button size="sm" className="hidden md:flex gap-2 gradient-primary border-0 text-primary-foreground">
                    <LogIn className="h-4 w-4" />
                    {t.nav_sign_in}
                  </Button>
                </Link>
              )
            )}

            {/* Mobile more menu */}
            <button
              className="lg:hidden p-2 rounded-xl hover:bg-muted transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile expanded menu */}
        {isMobileMenuOpen && (
          <nav className="lg:hidden border-t bg-card/95 backdrop-blur-lg animate-slide-up">
            <div className="container mx-auto px-4 py-3 space-y-1">
              {navItems.map(({ path, label, icon: Icon }) => (
                <Link
                  key={path}
                  to={path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all touch-target",
                    location.pathname === path
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {label}
                </Link>
              ))}

              {isHod && (
                <Link to="/hod" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-primary hover:bg-primary/5">
                  <Building2 className="h-5 w-5" />HOD Portal
                </Link>
              )}

              {isFaculty && (
                <Link to="/faculty" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-primary hover:bg-primary/5">
                  <GraduationCap className="h-5 w-5" />Faculty Portal
                </Link>
              )}

              {isAdmin && (
                <Link to="/admin" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-primary hover:bg-primary/5">
                  <Shield className="h-5 w-5" />{t.nav_admin}
                </Link>
              )}

              <div className="border-t pt-2 mt-2">
                {user ? (
                  <>
                    <Link to="/profile" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted">
                      <UserCircle className="h-5 w-5" />My Profile
                    </Link>
                    <button onClick={() => { handleSignOut(); setIsMobileMenuOpen(false); }} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/5 w-full text-left">
                      <LogOut className="h-5 w-5" />{t.nav_sign_out}
                    </button>
                  </>
                ) : (
                  <Link to="/auth" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-primary hover:bg-primary/5">
                    <LogIn className="h-5 w-5" />{t.nav_sign_in}
                  </Link>
                )}
              </div>
            </div>
          </nav>
        )}
      </header>

      {/* Main content — with bottom padding for mobile nav */}
      <main className="container mx-auto px-4 py-6 flex-1 pb-24 lg:pb-6">{children}</main>

      {/* Footer — hidden on mobile (bottom nav replaces it) */}
      <footer className="hidden lg:block border-t bg-muted/30 mt-auto">
        <div className="container mx-auto px-4 py-4 text-center text-sm text-muted-foreground">
          <p>{t.footer_tagline}</p>
          <p className="text-xs mt-1">{t.footer_subtitle}</p>
        </div>
      </footer>

      {/* Mobile bottom navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bottom-nav border-t">
        <div className="flex items-center justify-around px-1 py-1.5">
          {mobileNavItems.map(({ path, label, icon: Icon }) => {
            const isActive = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all min-w-[56px]",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              >
                <div className={cn(
                  "p-1.5 rounded-xl transition-all",
                  isActive && "bg-primary/10"
                )}>
                  <Icon className={cn("h-5 w-5", isActive && "stroke-[2.5px]")} />
                </div>
                <span className={cn(
                  "text-[10px] font-medium",
                  isActive && "font-semibold"
                )}>
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
        {/* Safe area for notched phones */}
        <div className="h-[env(safe-area-inset-bottom)]" />
      </nav>
    </div>
  );
};