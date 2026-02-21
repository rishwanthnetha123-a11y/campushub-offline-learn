import { useState, useEffect } from 'react';
import { Download, Trash2, HardDrive, Video, FileText, Music, RefreshCw, CheckCircle2, FolderOpen, Play, WifiOff, AlertCircle, Loader2, Share2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useOfflineStorage } from '@/hooks/use-offline-storage';
import { useFileDownload } from '@/hooks/use-file-download';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { getLanguageName } from '@/lib/languages';
import { Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FileMetadata } from '@/lib/file-storage';

interface DownloadedVideoInfo {
  id: string;
  title: string;
  subject: string;
  fileSize: string;
  fileSizeBytes: number;
  resolution: string;
  language: string;
}

interface DownloadedResourceInfo {
  id: string;
  title: string;
  type: string;
  fileSize: string;
  fileSizeBytes: number;
  language: string;
}

const DownloadsPage = () => {
  const { isOnline, isSyncing, syncPending, getProgress } = useOfflineStorage();
  const { allMeta, removeFile, storageUsed, getDownloadState } = useFileDownload();
  const { t } = useLanguage();
  const [videoInfoMap, setVideoInfoMap] = useState<Record<string, DownloadedVideoInfo>>({});
  const [resourceInfoMap, setResourceInfoMap] = useState<Record<string, DownloadedResourceInfo>>({});

  const videoMetas = allMeta.filter(m => m.contentType === 'video');
  const resourceMetas = allMeta.filter(m => m.contentType === 'resource');
  const downloadedVideos = videoMetas.filter(m => m.status === 'downloaded');
  const downloadedResources = resourceMetas.filter(m => m.status === 'downloaded');
  const failedDownloads = allMeta.filter(m => m.status === 'failed');

  useEffect(() => {
    const videoIds = videoMetas.map(d => d.contentId);
    const resourceIds = resourceMetas.map(d => d.contentId);
    const fetchInfo = async () => {
      if (videoIds.length > 0) {
        const { data } = await supabase.from('videos').select('id, title, subject, file_size, file_size_bytes, resolution, language').in('id', videoIds);
        if (data) {
          const map: Record<string, DownloadedVideoInfo> = {};
          data.forEach(v => { map[v.id] = { id: v.id, title: v.title, subject: v.subject, fileSize: v.file_size || '0 MB', fileSizeBytes: v.file_size_bytes || 0, resolution: v.resolution || '360p', language: (v as any).language || 'en' }; });
          setVideoInfoMap(map);
        }
      }
      if (resourceIds.length > 0) {
        const { data } = await supabase.from('resources').select('id, title, type, file_size, file_size_bytes, language').in('id', resourceIds);
        if (data) {
          const map: Record<string, DownloadedResourceInfo> = {};
          data.forEach(r => { map[r.id] = { id: r.id, title: r.title, type: r.type, fileSize: r.file_size || '0 MB', fileSizeBytes: r.file_size_bytes || 0, language: (r as any).language || 'en' }; });
          setResourceInfoMap(map);
        }
      }
    };
    if (videoIds.length > 0 || resourceIds.length > 0) fetchInfo();
  }, [allMeta]);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getTypeIcon = (type: string) => type === 'audio' ? Music : FileText;

  const getStatusBadge = (meta: FileMetadata) => {
    switch (meta.status) {
      case 'downloaded':
        return <span className="inline-flex items-center gap-1 text-xs text-success"><CheckCircle2 className="h-3 w-3" />Downloaded</span>;
      case 'downloading':
        return <span className="inline-flex items-center gap-1 text-xs text-primary"><Loader2 className="h-3 w-3 animate-spin" />{Math.round(meta.progress)}%</span>;
      case 'failed':
        return <span className="inline-flex items-center gap-1 text-xs text-destructive"><AlertCircle className="h-3 w-3" />Failed</span>;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-heading text-foreground flex items-center gap-2"><Download className="h-6 w-6 text-muted-foreground" />{t.downloads_title}</h1>
          <p className="text-muted-foreground">{t.downloads_subtitle}</p>
        </div>
        {syncPending > 0 && (
          <div className="flex items-center gap-2 text-sm">
            {isSyncing ? (<><RefreshCw className="h-4 w-4 animate-spin text-primary" /><span>{t.downloads_syncing}</span></>) : (<span className="text-warning">{syncPending} {t.downloads_pending_sync}</span>)}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-3 rounded-lg bg-muted"><HardDrive className="h-6 w-6 text-muted-foreground" /></div><div><p className="text-2xl font-bold">{formatBytes(storageUsed)}</p><p className="text-sm text-muted-foreground">{t.downloads_storage_used}</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-3 rounded-lg bg-primary/10"><Video className="h-6 w-6 text-primary" /></div><div><p className="text-2xl font-bold">{downloadedVideos.length}</p><p className="text-sm text-muted-foreground">{t.downloads_videos}</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-3 rounded-lg bg-success/10"><FileText className="h-6 w-6 text-success" /></div><div><p className="text-2xl font-bold">{downloadedResources.length}</p><p className="text-sm text-muted-foreground">{t.downloads_resources}</p></div></div></CardContent></Card>
      </div>

      {/* Offline ready banner */}
      {(downloadedVideos.length > 0 || downloadedResources.length > 0) && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-primary/10"><WifiOff className="h-6 w-6 text-primary" /></div>
                <div>
                  <h3 className="font-semibold text-foreground">{t.downloads_offline_ready}</h3>
                  <p className="text-sm text-muted-foreground">{downloadedVideos.length + downloadedResources.length} {t.downloads_offline_desc}</p>
                </div>
              </div>
              <div className="flex gap-2">
                {downloadedVideos.length > 0 && <Link to={`/video/${downloadedVideos[0].contentId}`}><Button className="gap-2"><Play className="h-4 w-4" />{t.downloads_open_offline}</Button></Link>}
                {downloadedVideos.length === 0 && downloadedResources.length > 0 && <Link to={`/resource/${downloadedResources[0].contentId}`}><Button className="gap-2"><FolderOpen className="h-4 w-4" />{t.downloads_open_offline}</Button></Link>}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Failed downloads */}
      {failedDownloads.length > 0 && (
        <Card className="border-destructive/30">
          <CardHeader><CardTitle className="flex items-center gap-2 text-destructive"><AlertCircle className="h-5 w-5" />Failed Downloads ({failedDownloads.length})</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {failedDownloads.map(meta => (
                <div key={meta.contentId} className="flex items-center gap-4 p-3 rounded-lg bg-destructive/5">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{videoInfoMap[meta.contentId]?.title || resourceInfoMap[meta.contentId]?.title || meta.contentId}</p>
                    <p className="text-xs text-muted-foreground">{meta.error}</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => removeFile(meta.contentId)} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Videos */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Video className="h-5 w-5 text-primary" />{t.downloads_videos} ({downloadedVideos.length})</CardTitle></CardHeader>
        <CardContent>
          {downloadedVideos.length === 0 ? (
            <div className="text-center py-8"><Video className="h-12 w-12 text-muted-foreground mx-auto mb-3" /><p className="text-muted-foreground">{t.downloads_no_videos}</p><Link to="/videos"><Button className="mt-4" variant="outline">{t.downloads_browse_videos}</Button></Link></div>
          ) : (
            <div className="space-y-2">
              {downloadedVideos.map(meta => {
                const video = videoInfoMap[meta.contentId];
                const progress = getProgress(meta.contentId);
                return (
                  <div key={meta.contentId} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                    <div className="p-2 rounded-lg bg-success/10"><CheckCircle2 className="h-5 w-5 text-success" /></div>
                    <Link to={`/video/${meta.contentId}`} className="flex-1 min-w-0">
                      <p className="font-medium truncate hover:text-primary transition-colors">{video?.title || 'Downloaded Video'}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{video?.subject || 'Unknown'}</span><span>•</span>
                        <span>{formatBytes(meta.sizeBytes)}</span><span>•</span>
                        <span>{video?.resolution || '—'}</span>
                        {video?.language && video.language !== 'en' && (<><span>•</span><Globe className="h-3 w-3" /><span>{getLanguageName(video.language)}</span></>)}
                        {progress?.completed && (<><span>•</span><span className="text-success">{t.progress_completed}</span></>)}
                      </div>
                    </Link>
                    <Button variant="ghost" size="icon" onClick={() => removeFile(meta.contentId)} className="text-destructive hover:text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resources */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-success" />{t.downloads_resources} ({downloadedResources.length})</CardTitle></CardHeader>
        <CardContent>
          {downloadedResources.length === 0 ? (
            <div className="text-center py-8"><FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" /><p className="text-muted-foreground">{t.downloads_no_resources}</p><Link to="/resources"><Button className="mt-4" variant="outline">{t.downloads_browse_resources}</Button></Link></div>
          ) : (
            <div className="space-y-2">
              {downloadedResources.map(meta => {
                const resource = resourceInfoMap[meta.contentId];
                const progress = getProgress(meta.contentId);
                const TypeIcon = getTypeIcon(resource?.type || 'pdf');
                return (
                  <div key={meta.contentId} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                    <div className="p-2 rounded-lg bg-success/10"><CheckCircle2 className="h-5 w-5 text-success" /></div>
                    <Link to={`/resource/${meta.contentId}`} className="flex-1 min-w-0">
                      <p className="font-medium truncate hover:text-primary transition-colors">{resource?.title || 'Downloaded Resource'}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <TypeIcon className="h-3 w-3" /><span className="capitalize">{resource?.type || 'file'}</span><span>•</span>
                        <span>{formatBytes(meta.sizeBytes)}</span>
                        {resource?.language && resource.language !== 'en' && (<><span>•</span><Globe className="h-3 w-3" /><span>{getLanguageName(resource.language)}</span></>)}
                        {progress?.completed && (<><span>•</span><span className="text-success">{t.progress_completed}</span></>)}
                      </div>
                    </Link>
                    <Button variant="ghost" size="icon" onClick={() => removeFile(meta.contentId)} className="text-destructive hover:text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></Button>
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
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10"><FolderOpen className="h-5 w-5 text-primary" /></div>
            <div>
              <h3 className="font-semibold mb-2">{t.downloads_about}</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Files are stored in persistent device storage (IndexedDB / Filesystem)</li>
                <li>• Downloads persist after refresh and app restart</li>
                <li>• Videos and resources play directly from local storage when offline</li>
                <li>• Only metadata syncs when back online — files are never re-downloaded</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DownloadsPage;
