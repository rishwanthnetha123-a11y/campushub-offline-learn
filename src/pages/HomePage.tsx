import { Link } from 'react-router-dom';
import { Video, FileText, Download, Trophy, Wifi, WifiOff, Zap, HardDrive, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useOfflineStorage } from '@/hooks/use-offline-storage';
import { demoVideos, demoResources } from '@/data/demo-content';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

const HomePage = () => {
  const { getStorageStats, isOnline, downloads, progress } = useOfflineStorage();
  const { t } = useLanguage();
  const stats = getStorageStats();

  const features = [
    { icon: Video, title: t.home_offline_videos, description: t.home_offline_videos_desc, link: '/videos', color: 'text-primary' },
    { icon: FileText, title: t.home_learning_resources, description: t.home_learning_resources_desc, link: '/resources', color: 'text-success' },
    { icon: Trophy, title: t.home_track_progress, description: t.home_track_progress_desc, link: '/progress', color: 'text-accent' },
    { icon: Download, title: t.home_download_manager, description: t.home_download_manager_desc, link: '/downloads', color: 'text-muted-foreground' },
  ];

  const benefits = [
    { icon: WifiOff, text: t.home_works_offline },
    { icon: Zap, text: t.home_less_data },
    { icon: HardDrive, text: t.home_low_end },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <section className="text-center py-8">
        <h1 className="text-heading-lg text-foreground mb-4">{t.home_hero_title}</h1>
        <p className="text-body-lg text-muted-foreground max-w-2xl mx-auto mb-6">{t.home_hero_desc}</p>
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          {benefits.map(({ icon: Icon, text }) => (
            <div key={text} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-success/10 text-success text-sm font-medium">
              <Icon className="h-4 w-4" />{text}
            </div>
          ))}
        </div>
        <div className="flex justify-center gap-4">
          <Link to="/videos"><Button size="lg" className="gap-2"><Video className="h-5 w-5" />{t.home_start_learning}</Button></Link>
          <Link to="/downloads"><Button size="lg" variant="outline" className="gap-2"><Download className="h-5 w-5" />{t.home_my_downloads}</Button></Link>
        </div>
      </section>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="text-center"><CardContent className="pt-6"><div className="text-3xl font-bold text-primary mb-1">{demoVideos.length}</div><p className="text-sm text-muted-foreground">{t.home_videos_available}</p></CardContent></Card>
        <Card className="text-center"><CardContent className="pt-6"><div className="text-3xl font-bold text-success mb-1">{stats.totalDownloads}</div><p className="text-sm text-muted-foreground">{t.home_downloaded}</p></CardContent></Card>
        <Card className="text-center"><CardContent className="pt-6"><div className="text-3xl font-bold text-accent mb-1">{stats.completedCount}</div><p className="text-sm text-muted-foreground">{t.home_completed}</p></CardContent></Card>
        <Card className="text-center"><CardContent className="pt-6"><div className="text-3xl font-bold text-foreground mb-1">{stats.quizzesPassed}</div><p className="text-sm text-muted-foreground">{t.home_quizzes_passed}</p></CardContent></Card>
      </section>

      <Card className={cn("border-2", isOnline ? "border-success/30 bg-success/5" : "border-warning/30 bg-warning/5")}>
        <CardContent className="py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isOnline ? <Wifi className="h-6 w-6 text-success" /> : <WifiOff className="h-6 w-6 text-warning" />}
            <div>
              <p className="font-medium">{isOnline ? t.home_online : t.home_offline}</p>
              <p className="text-sm text-muted-foreground">{isOnline ? t.home_online_desc : t.home_offline_desc}</p>
            </div>
          </div>
          {isOnline && <Link to="/videos"><Button variant="outline" size="sm">{t.home_download_content}</Button></Link>}
        </CardContent>
      </Card>

      <section>
        <h2 className="text-heading text-foreground mb-4">{t.home_platform_features}</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {features.map(({ icon: Icon, title, description, link, color }) => (
            <Link key={title} to={link}>
              <Card className="h-full hover:shadow-md transition-shadow cursor-pointer group">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className={cn("p-3 rounded-lg bg-muted", color)}><Icon className="h-6 w-6" /></div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">{title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-muted rounded-xl p-6">
        <h2 className="text-heading text-foreground mb-4">{t.home_why_offline}</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { title: t.home_rural, desc: t.home_rural_desc },
            { title: t.home_data_costs, desc: t.home_data_costs_desc },
            { title: t.home_continuity, desc: t.home_continuity_desc },
          ].map(({ title, desc }) => (
            <div key={title}>
              <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-success" />{title}
              </h3>
              <p className="text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default HomePage;
