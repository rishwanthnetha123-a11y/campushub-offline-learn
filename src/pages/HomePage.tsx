import { Link } from 'react-router-dom';
import { Video, FileText, Download, Trophy, Wifi, WifiOff, Zap, HardDrive, CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useOfflineStorage } from '@/hooks/use-offline-storage';
import { demoVideos, demoResources } from '@/data/demo-content';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { NoticesBanner } from '@/components/NoticesBanner';
import { PageTransition, StaggerContainer, StaggerItem, FadeIn } from '@/components/PageTransition';

const HomePage = () => {
  const { getStorageStats, isOnline, downloads, progress } = useOfflineStorage();
  const { t } = useLanguage();
  const stats = getStorageStats();

  const features = [
    { icon: Video, title: t.home_offline_videos, description: t.home_offline_videos_desc, link: '/videos', gradient: 'from-primary/10 to-primary/5', iconColor: 'text-primary', iconBg: 'bg-primary/10' },
    { icon: FileText, title: t.home_learning_resources, description: t.home_learning_resources_desc, link: '/resources', gradient: 'from-success/10 to-success/5', iconColor: 'text-success', iconBg: 'bg-success/10' },
    { icon: Trophy, title: t.home_track_progress, description: t.home_track_progress_desc, link: '/progress', gradient: 'from-accent/10 to-accent/5', iconColor: 'text-accent', iconBg: 'bg-accent/10' },
    { icon: Download, title: t.home_download_manager, description: t.home_download_manager_desc, link: '/downloads', gradient: 'from-muted to-muted/50', iconColor: 'text-muted-foreground', iconBg: 'bg-muted' },
  ];

  const benefits = [
    { icon: WifiOff, text: t.home_works_offline },
    { icon: Zap, text: t.home_less_data },
    { icon: HardDrive, text: t.home_low_end },
  ];

  const statCards = [
    { value: demoVideos.length, label: t.home_videos_available, color: 'text-primary', borderColor: 'border-primary/20' },
    { value: stats.totalDownloads, label: t.home_downloaded, color: 'text-success', borderColor: 'border-success/20' },
    { value: stats.completedCount, label: t.home_completed, color: 'text-accent', borderColor: 'border-accent/20' },
    { value: stats.quizzesPassed, label: t.home_quizzes_passed, color: 'text-foreground', borderColor: 'border-border' },
  ];

  return (
    <PageTransition className="space-y-10">
      {/* Hero Section */}
      <section className="relative text-center py-12 rounded-2xl gradient-hero overflow-hidden">
        <div className="relative z-10 max-w-3xl mx-auto px-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 animate-scale-in">
            <Sparkles className="h-4 w-4" />
            {isOnline ? 'Connected — sync & download content' : 'Offline mode — learning continues'}
          </div>
          <h1 className="text-heading-xl text-foreground mb-4 tracking-tight">
            {t.home_hero_title}
          </h1>
          <p className="text-body-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            {t.home_hero_desc}
          </p>
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            {benefits.map(({ icon: Icon, text }) => (
              <div key={text} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-success/10 text-success text-sm font-medium border border-success/20">
                <Icon className="h-4 w-4" />{text}
              </div>
            ))}
          </div>
          <div className="flex justify-center gap-4">
            <Link to="/videos">
              <Button size="lg" className="gap-2 gradient-primary border-0 text-primary-foreground shadow-md hover:shadow-lg transition-shadow h-12 px-6 rounded-xl">
                <Video className="h-5 w-5" />{t.home_start_learning}
              </Button>
            </Link>
            <Link to="/downloads">
              <Button size="lg" variant="outline" className="gap-2 h-12 px-6 rounded-xl bg-card hover:bg-muted">
                <Download className="h-5 w-5" />{t.home_my_downloads}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Notices Banner */}
      <NoticesBanner />

      {/* Stats Grid */}
      <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map(({ value, label, color, borderColor }) => (
          <StaggerItem key={label}>
            <Card className={cn("text-center card-elevated stat-card border card-interactive", borderColor)}>
              <CardContent className="pt-6 pb-4">
                <div className={cn("text-3xl font-bold mb-1 tracking-tight", color)}>{value}</div>
                <p className="text-xs text-muted-foreground font-medium">{label}</p>
              </CardContent>
            </Card>
          </StaggerItem>
        ))}
      </StaggerContainer>

      {/* Connection Status Banner */}
      <Card className={cn(
        "overflow-hidden border",
        isOnline ? "border-success/30" : "border-warning/30"
      )}>
        <CardContent className="py-4 px-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={cn(
              "p-2.5 rounded-xl",
              isOnline ? "bg-success/10" : "bg-warning/10"
            )}>
              {isOnline ? <Wifi className="h-6 w-6 text-success" /> : <WifiOff className="h-6 w-6 text-warning animate-pulse-soft" />}
            </div>
            <div>
              <p className="font-semibold text-foreground">{isOnline ? t.home_online : t.home_offline}</p>
              <p className="text-sm text-muted-foreground">{isOnline ? t.home_online_desc : t.home_offline_desc}</p>
            </div>
          </div>
          {isOnline && (
            <Link to="/videos">
              <Button variant="outline" size="sm" className="gap-2 border-success/30 text-success hover:bg-success/5">
                {t.home_download_content}
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          )}
        </CardContent>
      </Card>

      {/* Features Grid */}
      <FadeIn delay={0.2}>
        <h2 className="text-heading text-foreground mb-5">{t.home_platform_features}</h2>
        <StaggerContainer className="grid md:grid-cols-2 gap-4">
          {features.map(({ icon: Icon, title, description, link, iconColor, iconBg }) => (
            <StaggerItem key={title}>
              <Link to={link}>
                <Card className="h-full card-elevated cursor-pointer group border card-interactive">
                  <CardContent className="pt-6 pb-5">
                    <div className="flex items-start gap-4">
                      <div className={cn("p-3 rounded-xl transition-smooth", iconBg)}>
                        <Icon className={cn("h-6 w-6", iconColor)} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">{title}</h3>
                        <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{description}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-1 transition-all mt-1 shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </FadeIn>

      {/* Why Offline Section */}
      <section className="bg-muted/50 rounded-2xl p-8 border">
        <h2 className="text-heading text-foreground mb-6">{t.home_why_offline}</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { title: t.home_rural, desc: t.home_rural_desc },
            { title: t.home_data_costs, desc: t.home_data_costs_desc },
            { title: t.home_continuity, desc: t.home_continuity_desc },
          ].map(({ title, desc }) => (
            <div key={title}>
              <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-success shrink-0" />{title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>
    </PageTransition>
  );
};

export default HomePage;