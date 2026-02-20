import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, Video, FileText, Trophy, Download, Menu, X, MessageSquare, 
  Shield, LogIn, LogOut, TicketIcon, Globe, CalendarDays
} from 'lucide-react';
import { useState } from 'react';
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

const NAV_ICONS = [Home, Video, FileText, MessageSquare, TicketIcon, Trophy, Download] as const;

export const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin, signOut, isLoading } = useAuthContext();
  const { language, setLanguage, t } = useLanguage();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { path: '/', label: t.nav_home, icon: Home },
    { path: '/videos', label: t.nav_videos, icon: Video },
    { path: '/resources', label: t.nav_resources, icon: FileText },
    { path: '/ask', label: t.nav_ask_ai, icon: MessageSquare },
    { path: '/study-plan', label: 'Study Plan', icon: CalendarDays },
    { path: '/support', label: t.nav_support, icon: TicketIcon },
    { path: '/progress', label: t.nav_progress, icon: Trophy },
    { path: '/downloads', label: t.nav_downloads, icon: Download },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-card border-b shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src={campusHubLogo} alt="CampusHub" className="w-10 h-10 rounded-lg object-contain" />
            <div>
              <h1 className="font-bold text-lg text-foreground">CampusHub</h1>
              <p className="text-xs text-muted-foreground -mt-0.5">Offline Learning</p>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
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

          <div className="flex items-center gap-2">
            {/* Language Selector */}
            <Select value={language} onValueChange={(v) => setLanguage(v as ContentLanguageCode)}>
              <SelectTrigger className="w-[120px] h-9 text-xs">
                <Globe className="h-3.5 w-3.5 mr-1" />
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

            {isAdmin && (
              <Link to="/admin">
                <Button variant="outline" size="sm" className="hidden md:flex gap-2">
                  <Shield className="h-4 w-4" />
                  {t.nav_admin}
                </Button>
              </Link>
            )}

            {!isLoading && (
              user ? (
                <Button variant="ghost" size="sm" onClick={handleSignOut} className="hidden md:flex gap-2">
                  <LogOut className="h-4 w-4" />
                  {t.nav_sign_out}
                </Button>
              ) : (
                <Link to="/auth">
                  <Button variant="outline" size="sm" className="hidden md:flex gap-2">
                    <LogIn className="h-4 w-4" />
                    {t.nav_sign_in}
                  </Button>
                </Link>
              )
            )}

            <button
              className="lg:hidden p-2 rounded-lg hover:bg-muted"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <nav className="lg:hidden border-t bg-card animate-slide-in">
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

              {isAdmin && (
                <Link
                  to="/admin"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-primary hover:bg-muted"
                >
                  <Shield className="h-5 w-5" />
                  {t.nav_admin}
                </Link>
              )}

              <div className="border-t pt-2 mt-2">
                {user ? (
                  <button
                    onClick={() => { handleSignOut(); setIsMobileMenuOpen(false); }}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted w-full text-left"
                  >
                    <LogOut className="h-5 w-5" />
                    {t.nav_sign_out}
                  </button>
                ) : (
                  <Link
                    to="/auth"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted"
                  >
                    <LogIn className="h-5 w-5" />
                    {t.nav_sign_in}
                  </Link>
                )}
              </div>
            </div>
          </nav>
        )}
      </header>

      <main className="container mx-auto px-4 py-6">{children}</main>

      <footer className="border-t bg-muted/50 mt-auto">
        <div className="container mx-auto px-4 py-4 text-center text-sm text-muted-foreground">
          <p>{t.footer_tagline}</p>
          <p className="text-xs mt-1">{t.footer_subtitle}</p>
        </div>
      </footer>
    </div>
  );
};
