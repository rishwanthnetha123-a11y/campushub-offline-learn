import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Download, 
  FileText, 
  Music,
  Clock,
  HardDrive,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PDFViewer } from '@/components/PDFViewer';
import { AudioPlayer } from '@/components/AudioPlayer';
import { DownloadButton } from '@/components/DownloadButton';
import { OfflineStatusBadge } from '@/components/OfflineStatusBadge';
import { ProgressRing } from '@/components/ProgressRing';
import { useOfflineStorage } from '@/hooks/use-offline-storage';
import { demoResources } from '@/data/demo-content';

const ResourceDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { 
    isDownloaded, 
    markAsDownloaded, 
    removeDownload, 
    getProgress, 
    updateProgress,
    markCompleted,
    isOnline
  } = useOfflineStorage();

  const resource = demoResources.find(r => r.id === id);
  const progress = getProgress(id || '');

  if (!resource) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Resource not found</p>
        <Button variant="link" onClick={() => navigate('/resources')}>
          Back to Resources
        </Button>
      </div>
    );
  }

  const downloaded = isDownloaded(resource.id);
  const canView = downloaded || isOnline;

  const handleProgress = (currentPage: number, totalPages: number) => {
    const percent = (currentPage / totalPages) * 100;
    updateProgress(resource.id, 'resource', {
      progress: Math.round(percent),
    });

    if (percent >= 90) {
      markCompleted(resource.id, 'resource');
    }
  };

  const handleAudioProgress = (percent: number) => {
    updateProgress(resource.id, 'resource', {
      progress: Math.round(percent),
    });
  };

  const handleAudioComplete = () => {
    markCompleted(resource.id, 'resource');
  };

  const renderContent = () => {
    if (!canView) {
      return (
        <Card className="min-h-[400px] flex items-center justify-center bg-muted">
          <div className="text-center p-6">
            <Download className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="font-medium mb-2">Download required for offline viewing</p>
            <p className="text-sm text-muted-foreground">
              You're offline. Download this resource when you have internet access.
            </p>
          </div>
        </Card>
      );
    }

    switch (resource.type) {
      case 'pdf':
        return (
          <PDFViewer
            url={resource.fileUrl}
            title={resource.title}
            pages={resource.pages}
            onProgress={handleProgress}
          />
        );
      
      case 'audio':
        return (
          <AudioPlayer
            src={resource.fileUrl}
            title={resource.title}
            onProgress={handleAudioProgress}
            onComplete={handleAudioComplete}
            className="max-w-md mx-auto"
          />
        );
      
      case 'notes':
        return (
          <Card className="p-6">
            <div className="prose prose-sm max-w-none">
              <h3>{resource.title}</h3>
              <p>{resource.description}</p>
              <div className="bg-muted p-4 rounded-lg mt-4">
                <p className="text-sm text-muted-foreground italic">
                  📝 This is a demo notes file. In a real application, the notes content 
                  would be displayed here as formatted text that works completely offline.
                </p>
                <ul className="mt-4 space-y-2 text-sm">
                  <li>• Key concept 1: Introduction to the topic</li>
                  <li>• Key concept 2: Main principles and theories</li>
                  <li>• Key concept 3: Practical applications</li>
                  <li>• Key concept 4: Summary and review points</li>
                </ul>
              </div>
            </div>
          </Card>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back button */}
      <Button variant="ghost" onClick={() => navigate('/resources')}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Resources
      </Button>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-4">
          {renderContent()}

          {/* Resource Info */}
          <div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-sm font-medium text-success">
                  {resource.subject} • {resource.topic}
                </span>
                <h1 className="text-heading text-foreground mt-1">
                  {resource.title}
                </h1>
              </div>
              <OfflineStatusBadge 
                status={downloaded ? 'offline-ready' : 'not-downloaded'} 
              />
            </div>

            <p className="text-muted-foreground mt-3">
              {resource.description}
            </p>

            <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <HardDrive className="h-4 w-4" />
                {resource.fileSize}
              </span>
              {resource.pages && (
                <span className="flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  {resource.pages} pages
                </span>
              )}
              {resource.duration && (
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {resource.duration}
                </span>
              )}
              <span className="capitalize">{resource.type}</span>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Download Card */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-3">Offline Access</h3>
              <DownloadButton
                isDownloaded={downloaded}
                fileSize={resource.fileSize}
                onDownload={() => markAsDownloaded(resource.id, 'resource')}
                onRemove={() => removeDownload(resource.id)}
              />
              <p className="text-xs text-muted-foreground mt-3">
                {downloaded 
                  ? 'This resource is available offline' 
                  : 'Download for offline access when you have internet'}
              </p>
            </CardContent>
          </Card>

          {/* Progress Card */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-3">Your Progress</h3>
              <div className="flex items-center gap-4">
                <ProgressRing 
                  progress={progress?.progress || 0} 
                  size={64} 
                  strokeWidth={6}
                />
                <div>
                  <p className="font-medium">
                    {progress?.completed ? 'Completed!' : 'In Progress'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {Math.round(progress?.progress || 0)}% viewed
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* External Link (for PDFs) */}
          {resource.type === 'pdf' && resource.fileUrl && (
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => window.open(resource.fileUrl, '_blank')}
            >
              <ExternalLink className="h-4 w-4" />
              Open in New Tab
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResourceDetailPage;
