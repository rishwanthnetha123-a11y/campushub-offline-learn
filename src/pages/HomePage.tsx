import { Link } from 'react-router-dom';
import { 
  Video, 
  FileText, 
  Download, 
  Trophy,
  Wifi,
  WifiOff,
  Zap,
  HardDrive,
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useOfflineStorage } from '@/hooks/use-offline-storage';
import { demoVideos, demoResources } from '@/data/demo-content';
import { cn } from '@/lib/utils';

const HomePage = () => {
  const { getStorageStats, isOnline, downloads, progress } = useOfflineStorage();
  const stats = getStorageStats();

  const features = [
    {
      icon: Video,
      title: 'Offline Videos',
      description: 'Download low-resolution (360p/480p) educational videos for offline viewing',
      link: '/videos',
      color: 'text-primary',
    },
    {
      icon: FileText,
      title: 'Learning Resources',
      description: 'Access PDFs, notes, and audio materials without internet',
      link: '/resources',
      color: 'text-success',
    },
    {
      icon: Trophy,
      title: 'Track Progress',
      description: 'Monitor your learning journey with quizzes after each lesson',
      link: '/progress',
      color: 'text-accent',
    },
    {
      icon: Download,
      title: 'Download Manager',
      description: 'Manage your offline content and storage efficiently',
      link: '/downloads',
      color: 'text-muted-foreground',
    },
  ];

  const benefits = [
    { icon: WifiOff, text: 'Works completely offline' },
    { icon: Zap, text: '70% less data than streaming' },
    { icon: HardDrive, text: 'Optimized for low-end devices' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero Section */}
      <section className="text-center py-8">
        <h1 className="text-heading-lg text-foreground mb-4">
          Learn Anytime, Anywhere
        </h1>
        <p className="text-body-lg text-muted-foreground max-w-2xl mx-auto mb-6">
          CampusHub brings quality education to rural learners with offline-first 
          videos, resources, and quizzes—designed for low bandwidth and limited devices.
        </p>

        <div className="flex flex-wrap justify-center gap-3 mb-8">
          {benefits.map(({ icon: Icon, text }) => (
            <div 
              key={text}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-success/10 text-success text-sm font-medium"
            >
              <Icon className="h-4 w-4" />
              {text}
            </div>
          ))}
        </div>

        <div className="flex justify-center gap-4">
          <Link to="/videos">
            <Button size="lg" className="gap-2">
              <Video className="h-5 w-5" />
              Start Learning
            </Button>
          </Link>
          <Link to="/downloads">
            <Button size="lg" variant="outline" className="gap-2">
              <Download className="h-5 w-5" />
              My Downloads
            </Button>
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="text-center">
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-primary mb-1">
              {demoVideos.length}
            </div>
            <p className="text-sm text-muted-foreground">Videos Available</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-success mb-1">
              {stats.totalDownloads}
            </div>
            <p className="text-sm text-muted-foreground">Downloaded</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-accent mb-1">
              {stats.completedCount}
            </div>
            <p className="text-sm text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-foreground mb-1">
              {stats.quizzesPassed}
            </div>
            <p className="text-sm text-muted-foreground">Quizzes Passed</p>
          </CardContent>
        </Card>
      </section>

      {/* Connection Status Banner */}
      <Card className={cn(
        "border-2",
        isOnline ? "border-success/30 bg-success/5" : "border-warning/30 bg-warning/5"
      )}>
        <CardContent className="py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isOnline ? (
              <Wifi className="h-6 w-6 text-success" />
            ) : (
              <WifiOff className="h-6 w-6 text-warning" />
            )}
            <div>
              <p className="font-medium">
                {isOnline ? 'You are online' : 'You are offline'}
              </p>
              <p className="text-sm text-muted-foreground">
                {isOnline 
                  ? 'Download content now for offline access later' 
                  : 'Your downloaded content is ready to use'}
              </p>
            </div>
          </div>
          {isOnline && (
            <Link to="/videos">
              <Button variant="outline" size="sm">
                Download Content
              </Button>
            </Link>
          )}
        </CardContent>
      </Card>

      {/* Features Grid */}
      <section>
        <h2 className="text-heading text-foreground mb-4">Platform Features</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {features.map(({ icon: Icon, title, description, link, color }) => (
            <Link key={title} to={link}>
              <Card className="h-full hover:shadow-md transition-shadow cursor-pointer group">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className={cn("p-3 rounded-lg bg-muted", color)}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                        {title}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Why Offline Matters */}
      <section className="bg-muted rounded-xl p-6">
        <h2 className="text-heading text-foreground mb-4">
          Why Offline Learning Matters
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-success" />
              Critical for Rural Areas
            </h3>
            <p className="text-sm text-muted-foreground">
              Many rural students face unstable internet connections. Offline videos 
              ensure uninterrupted learning regardless of connectivity.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-success" />
              Reduces Data Costs
            </h3>
            <p className="text-sm text-muted-foreground">
              360p videos use 70% less data than HD streaming. Download once during 
              good connectivity, learn anytime.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-success" />
              Learning Continuity
            </h3>
            <p className="text-sm text-muted-foreground">
              Progress syncs automatically when online. Never lose your learning 
              progress, even during network outages.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
