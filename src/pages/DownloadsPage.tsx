import { 
  Download, 
  Trash2, 
  HardDrive,
  Video,
  FileText,
  Music,
  RefreshCw,
  CheckCircle2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useOfflineStorage } from '@/hooks/use-offline-storage';
import { demoVideos, demoResources } from '@/data/demo-content';
import { cn } from '@/lib/utils';

const DownloadsPage = () => {
  const { 
    downloads, 
    removeDownload, 
    isOnline, 
    isSyncing, 
    syncPending,
    getProgress 
  } = useOfflineStorage();

  // Calculate storage used
  const downloadedVideos = downloads
    .filter(d => d.contentType === 'video')
    .map(d => demoVideos.find(v => v.id === d.contentId))
    .filter(Boolean);

  const downloadedResources = downloads
    .filter(d => d.contentType === 'resource')
    .map(d => demoResources.find(r => r.id === d.contentId))
    .filter(Boolean);

  const totalSize = [
    ...downloadedVideos.map(v => v!.fileSizeBytes),
    ...downloadedResources.map(r => r!.fileSizeBytes),
  ].reduce((sum, size) => sum + size, 0);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'pdf': return FileText;
      case 'audio': return Music;
      default: return FileText;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-heading text-foreground flex items-center gap-2">
            <Download className="h-6 w-6 text-muted-foreground" />
            Downloaded Content
          </h1>
          <p className="text-muted-foreground">
            Manage your offline content and storage
          </p>
        </div>

        {/* Sync Status */}
        {syncPending > 0 && (
          <div className="flex items-center gap-2 text-sm">
            {isSyncing ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin text-primary" />
                <span>Syncing...</span>
              </>
            ) : (
              <span className="text-warning">{syncPending} pending sync</span>
            )}
          </div>
        )}
      </div>

      {/* Storage Stats */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-muted">
                <HardDrive className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatBytes(totalSize)}</p>
                <p className="text-sm text-muted-foreground">Storage Used</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-primary/10">
                <Video className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{downloadedVideos.length}</p>
                <p className="text-sm text-muted-foreground">Videos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-success/10">
                <FileText className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{downloadedResources.length}</p>
                <p className="text-sm text-muted-foreground">Resources</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Downloaded Videos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5 text-primary" />
            Videos ({downloadedVideos.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {downloadedVideos.length === 0 ? (
            <div className="text-center py-8">
              <Video className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No videos downloaded</p>
              <Link to="/videos">
                <Button className="mt-4" variant="outline">
                  Browse Videos
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {downloadedVideos.map(video => {
                const progress = getProgress(video!.id);
                const download = downloads.find(d => d.contentId === video!.id);

                return (
                  <div 
                    key={video!.id}
                    className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="p-2 rounded-lg bg-success/10">
                      <CheckCircle2 className="h-5 w-5 text-success" />
                    </div>

                    <Link 
                      to={`/video/${video!.id}`}
                      className="flex-1 min-w-0"
                    >
                      <p className="font-medium truncate hover:text-primary transition-colors">
                        {video!.title}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{video!.subject}</span>
                        <span>•</span>
                        <span>{video!.fileSize}</span>
                        <span>•</span>
                        <span>{video!.resolution}</span>
                        {progress?.completed && (
                          <>
                            <span>•</span>
                            <span className="text-success">Completed</span>
                          </>
                        )}
                      </div>
                    </Link>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeDownload(video!.id)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Downloaded Resources */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-success" />
            Resources ({downloadedResources.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {downloadedResources.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No resources downloaded</p>
              <Link to="/resources">
                <Button className="mt-4" variant="outline">
                  Browse Resources
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {downloadedResources.map(resource => {
                const progress = getProgress(resource!.id);
                const TypeIcon = getTypeIcon(resource!.type);

                return (
                  <div 
                    key={resource!.id}
                    className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="p-2 rounded-lg bg-success/10">
                      <CheckCircle2 className="h-5 w-5 text-success" />
                    </div>

                    <Link 
                      to={`/resource/${resource!.id}`}
                      className="flex-1 min-w-0"
                    >
                      <p className="font-medium truncate hover:text-primary transition-colors">
                        {resource!.title}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <TypeIcon className="h-3 w-3" />
                        <span className="capitalize">{resource!.type}</span>
                        <span>•</span>
                        <span>{resource!.fileSize}</span>
                        {progress?.completed && (
                          <>
                            <span>•</span>
                            <span className="text-success">Completed</span>
                          </>
                        )}
                      </div>
                    </Link>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeDownload(resource!.id)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-2">About Offline Storage</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Downloaded content is stored in your browser's local storage</li>
            <li>• Videos and resources remain available even without internet</li>
            <li>• Your progress syncs automatically when you're back online</li>
            <li>• Removing downloads frees up space but doesn't delete progress</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default DownloadsPage;
