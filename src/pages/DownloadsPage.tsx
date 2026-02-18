import { useState, useEffect } from 'react';
import { Download, Trash2, HardDrive, Video, FileText, Music, RefreshCw, CheckCircle2, FolderOpen, Play, WifiOff, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useOfflineStorage } from '@/hooks/use-offline-storage';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { getLanguageName } from '@/lib/languages';
import { cn } from '@/lib/utils';

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
  const { downloads, removeDownload, isOnline, isSyncing, syncPending, getProgress } = useOfflineStorage();
  const { t } = useLanguage();
  const [videoInfoMap, setVideoInfoMap] = useState<Record<string, DownloadedVideoInfo>>({});
  const [resourceInfoMap, setResourceInfoMap] = useState<Record<string, DownloadedResourceInfo>>({});

  const videoDownloads = downloads.filter(d => d.contentType === 'video');
  const resourceDownloads = downloads.filter(d => d.contentType === 'resource');

  useEffect(() => {
    const videoIds = videoDownloads.map(d => d.contentId);
    const resourceIds = resourceDownloads.map(d => d.contentId);
    const fetchInfo = async () => {
      if (videoIds.length > 0) {
        const { data } = await supabase.from('videos').select('id, title, subject, file_size, file_size_bytes, resolution, language').in('id', videoIds);
        if (data) { const map: Record<string, DownloadedVideoInfo> = {}; data.forEach(v => { map[v.id] = { id: v.id, title: v.title, subject: v.subject, fileSize: v.file_size || '0 MB', fileSizeBytes: v.file_size_bytes || 0, resolution: v.resolution || '360p', language: (v as any).language || 'en' }; }); setVideoInfoMap(map); }
      }
      if (resourceIds.length > 0) {
        const { data } = await supabase.from('resources').select('id, title, type, file_size, file_size_bytes, language').in('id', resourceIds);
        if (data) { const map: Record<string, DownloadedResourceInfo> = {}; data.forEach(r => { map[r.id] = { id: r.id, title: r.title, type: r.type, fileSize: r.file_size || '0 MB', fileSizeBytes: r.file_size_bytes || 0, language: (r as any).language || 'en' }; }); setResourceInfoMap(map); }
      }
    };
    fetchInfo();
  }, [downloads]);

  const totalSize = [...videoDownloads.map(d => videoInfoMap[d.contentId]?.fileSizeBytes || 0), ...resourceDownloads.map(d => resourceInfoMap[d.contentId]?.fileSizeBytes || 0)].reduce((sum, size) => sum + size, 0);
  const formatBytes = (bytes: number) => { if (bytes === 0) return '0 B'; const k = 1024; const sizes = ['B', 'KB', 'MB', 'GB']; const i = Math.floor(Math.log(bytes) / Math.log(k)); return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]; };
  const getTypeIcon = (type: string) => type === 'audio' ? Music : FileText;

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

      <div className="grid sm:grid-cols-3 gap-4">
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-3 rounded-lg bg-muted"><HardDrive className="h-6 w-6 text-muted-foreground" /></div><div><p className="text-2xl font-bold">{formatBytes(totalSize)}</p><p className="text-sm text-muted-foreground">{t.downloads_storage_used}</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-3 rounded-lg bg-primary/10"><Video className="h-6 w-6 text-primary" /></div><div><p className="text-2xl font-bold">{videoDownloads.length}</p><p className="text-sm text-muted-foreground">{t.downloads_videos}</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-3 rounded-lg bg-success/10"><FileText className="h-6 w-6 text-success" /></div><div><p className="text-2xl font-bold">{resourceDownloads.length}</p><p className="text-sm text-muted-foreground">{t.downloads_resources}</p></div></div></CardContent></Card>
      </div>

      {(videoDownloads.length > 0 || resourceDownloads.length > 0) && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-primary/10"><WifiOff className="h-6 w-6 text-primary" /></div>
                <div>
                  <h3 className="font-semibold text-foreground">{t.downloads_offline_ready}</h3>
                  <p className="text-sm text-muted-foreground">{videoDownloads.length + resourceDownloads.length} {t.downloads_offline_desc}</p>
                </div>
              </div>
              <div className="flex gap-2">
                {videoDownloads.length > 0 && <Link to={`/video/${videoDownloads[0].contentId}`}><Button className="gap-2"><Play className="h-4 w-4" />{t.downloads_open_offline}</Button></Link>}
                {videoDownloads.length === 0 && resourceDownloads.length > 0 && <Link to={`/resource/${resourceDownloads[0].contentId}`}><Button className="gap-2"><FolderOpen className="h-4 w-4" />{t.downloads_open_offline}</Button></Link>}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Video className="h-5 w-5 text-primary" />{t.downloads_videos} ({videoDownloads.length})</CardTitle></CardHeader>
        <CardContent>
          {videoDownloads.length === 0 ? (
            <div className="text-center py-8"><Video className="h-12 w-12 text-muted-foreground mx-auto mb-3" /><p className="text-muted-foreground">{t.downloads_no_videos}</p><Link to="/videos"><Button className="mt-4" variant="outline">{t.downloads_browse_videos}</Button></Link></div>
          ) : (
            <div className="space-y-2">
              {videoDownloads.map(download => {
                const video = videoInfoMap[download.contentId];
                const progress = getProgress(download.contentId);
                return (
                  <div key={download.contentId} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                    <div className="p-2 rounded-lg bg-success/10"><CheckCircle2 className="h-5 w-5 text-success" /></div>
                    <Link to={`/video/${download.contentId}`} className="flex-1 min-w-0">
                      <p className="font-medium truncate hover:text-primary transition-colors">{video?.title || 'Downloaded Video'}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{video?.subject || 'Unknown'}</span><span>•</span><span>{video?.fileSize || '—'}</span><span>•</span><span>{video?.resolution || '—'}</span>
                        {video?.language && video.language !== 'en' && (<><span>•</span><Globe className="h-3 w-3" /><span>{getLanguageName(video.language)}</span></>)}
                        {progress?.completed && (<><span>•</span><span className="text-success">{t.progress_completed}</span></>)}
                      </div>
                    </Link>
                    <Button variant="ghost" size="icon" onClick={() => removeDownload(download.contentId)} className="text-destructive hover:text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-success" />{t.downloads_resources} ({resourceDownloads.length})</CardTitle></CardHeader>
        <CardContent>
          {resourceDownloads.length === 0 ? (
            <div className="text-center py-8"><FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" /><p className="text-muted-foreground">{t.downloads_no_resources}</p><Link to="/resources"><Button className="mt-4" variant="outline">{t.downloads_browse_resources}</Button></Link></div>
          ) : (
            <div className="space-y-2">
              {resourceDownloads.map(download => {
                const resource = resourceInfoMap[download.contentId];
                const progress = getProgress(download.contentId);
                const TypeIcon = getTypeIcon(resource?.type || 'pdf');
                return (
                  <div key={download.contentId} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                    <div className="p-2 rounded-lg bg-success/10"><CheckCircle2 className="h-5 w-5 text-success" /></div>
                    <Link to={`/resource/${download.contentId}`} className="flex-1 min-w-0">
                      <p className="font-medium truncate hover:text-primary transition-colors">{resource?.title || 'Downloaded Resource'}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <TypeIcon className="h-3 w-3" /><span className="capitalize">{resource?.type || 'file'}</span><span>•</span><span>{resource?.fileSize || '—'}</span>
                        {resource?.language && resource.language !== 'en' && (<><span>•</span><Globe className="h-3 w-3" /><span>{getLanguageName(resource.language)}</span></>)}
                        {progress?.completed && (<><span>•</span><span className="text-success">{t.progress_completed}</span></>)}
                      </div>
                    </Link>
                    <Button variant="ghost" size="icon" onClick={() => removeDownload(download.contentId)} className="text-destructive hover:text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10"><FolderOpen className="h-5 w-5 text-primary" /></div>
            <div>
              <h3 className="font-semibold mb-2">{t.downloads_about}</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• {t.downloads_about_1}</li><li>• {t.downloads_about_2}</li><li>• {t.downloads_about_3}</li><li>• {t.downloads_about_4}</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DownloadsPage;
