import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Download, FileText, Music, Clock, HardDrive, ExternalLink, Loader2, CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PDFViewer } from '@/components/PDFViewer';
import { AudioPlayer } from '@/components/AudioPlayer';
import { DownloadButton } from '@/components/DownloadButton';
import { OfflineStatusBadge } from '@/components/OfflineStatusBadge';
import { ProgressRing } from '@/components/ProgressRing';
import { useOfflineStorage } from '@/hooks/use-offline-storage';
import { useFileDownload, useLocalFileUrl } from '@/hooks/use-file-download';
import { supabase } from '@/integrations/supabase/client';
import type { Resource } from '@/types/content';

const ResourceDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getProgress, updateProgress, markCompleted, isOnline } = useOfflineStorage();
  const { startDownload, removeFile, getDownloadState, retryDownload } = useFileDownload();

  const [resource, setResource] = useState<Resource | null>(null);
  const [loading, setLoading] = useState(true);
  const progress = getProgress(id || '');
  const downloadInfo = getDownloadState(id || '');

  useEffect(() => {
    const fetchResource = async () => {
      if (!id) { setLoading(false); return; }
      const { data, error } = await supabase
        .from('resources').select('*').eq('id', id).single();
      if (!error && data) {
        setResource({
          id: data.id, title: data.title, description: data.description || '',
          type: data.type as 'pdf' | 'notes' | 'audio',
          fileSize: data.file_size || '', fileSizeBytes: data.file_size_bytes || 0,
          subject: data.subject, topic: data.topic || '', fileUrl: data.file_url,
          pages: data.pages || undefined, duration: data.duration || undefined,
        });
      }
      setLoading(false);
    };
    fetchResource();
  }, [id]);

  const fileExt = resource?.type === 'pdf' ? 'pdf' : resource?.type === 'audio' ? 'mp3' : 'txt';
  const { url: fileSrc, isLocal } = useLocalFileUrl(id, resource?.fileUrl || '');

  if (loading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!resource) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Resource not found</p>
        <Button variant="link" onClick={() => navigate('/resources')}>Back to Resources</Button>
      </div>
    );
  }

  const isDownloaded = downloadInfo.state === 'downloaded';
  const canView = isDownloaded || isOnline;

  const handleDownload = () => {
    startDownload(resource.fileUrl, resource.id, 'resource', `${resource.id}.${fileExt}`);
  };

  const handleRetry = () => {
    retryDownload(resource.fileUrl, resource.id, 'resource', `${resource.id}.${fileExt}`);
  };

  const handleProgress = (currentPage: number, totalPages: number) => {
    const percent = (currentPage / totalPages) * 100;
    updateProgress(resource.id, 'resource', { progress: Math.round(percent) });
    if (percent >= 90) markCompleted(resource.id, 'resource');
  };

  const handleAudioProgress = (percent: number) => {
    updateProgress(resource.id, 'resource', { progress: Math.round(percent) });
  };

  const handleAudioComplete = () => markCompleted(resource.id, 'resource');

  const renderContent = () => {
    if (!canView) {
      return (
        <Card className="min-h-[400px] flex items-center justify-center bg-muted">
          <div className="text-center p-6">
            <Download className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="font-medium mb-2">Download required for offline viewing</p>
            <p className="text-sm text-muted-foreground">You're offline. Download this resource when you have internet access.</p>
          </div>
        </Card>
      );
    }

    switch (resource.type) {
      case 'pdf':
        return <PDFViewer url={fileSrc} title={resource.title} pages={resource.pages} onProgress={handleProgress} />;
      case 'audio':
        return <AudioPlayer src={fileSrc} title={resource.title} onProgress={handleAudioProgress} onComplete={handleAudioComplete} className="max-w-md mx-auto" />;
      case 'notes':
        return (
          <Card className="p-6">
            <div className="prose prose-sm max-w-none">
              <h3>{resource.title}</h3>
              <p>{resource.description}</p>
              <div className="bg-muted p-4 rounded-lg mt-4">
                <p className="text-sm text-muted-foreground italic">📝 Notes content is displayed here for offline access.</p>
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
      <Button variant="ghost" onClick={() => navigate('/resources')}>
        <ArrowLeft className="h-4 w-4 mr-2" />Back to Resources
      </Button>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {renderContent()}

          {isLocal && (
            <div className="flex items-center gap-2 text-sm text-success">
              <CheckCircle2 className="h-4 w-4" />
              Playing from local storage (offline)
            </div>
          )}

          <div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-sm font-medium text-success">{resource.subject} • {resource.topic}</span>
                <h1 className="text-heading text-foreground mt-1">{resource.title}</h1>
              </div>
              <OfflineStatusBadge status={isDownloaded ? 'offline-ready' : 'not-downloaded'} />
            </div>
            <p className="text-muted-foreground mt-3">{resource.description}</p>
            <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><HardDrive className="h-4 w-4" />{resource.fileSize}</span>
              {resource.pages && <span className="flex items-center gap-1"><FileText className="h-4 w-4" />{resource.pages} pages</span>}
              {resource.duration && <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{resource.duration}</span>}
              <span className="capitalize">{resource.type}</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-3">Offline Access</h3>
              <DownloadButton
                downloadState={downloadInfo.state}
                progress={downloadInfo.progress}
                fileSize={resource.fileSize}
                error={downloadInfo.error}
                onDownload={handleDownload}
                onRemove={() => removeFile(resource.id)}
                onRetry={handleRetry}
              />
              <p className="text-xs text-muted-foreground mt-3">
                {isDownloaded ? 'This resource is available offline' : 'Download for offline access when you have internet'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-3">Your Progress</h3>
              <div className="flex items-center gap-4">
                <ProgressRing progress={progress?.progress || 0} size={64} strokeWidth={6} />
                <div>
                  <p className="font-medium">{progress?.completed ? 'Completed!' : 'In Progress'}</p>
                  <p className="text-sm text-muted-foreground">{Math.round(progress?.progress || 0)}% viewed</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {resource.type === 'pdf' && resource.fileUrl && (
            <Button variant="outline" className="w-full gap-2" onClick={() => window.open(resource.fileUrl, '_blank')}>
              <ExternalLink className="h-4 w-4" />Open in New Tab
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResourceDetailPage;
