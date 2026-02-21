import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Share2, QrCode, Download, FileDown, Video, FileText, Music,
  CheckCircle2, Loader2, ArrowLeft, Copy, Check, ExternalLink,
  Smartphone, Globe, AlertCircle
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFileDownload } from '@/hooks/use-file-download';
import { useOfflineStorage } from '@/hooks/use-offline-storage';
import { supabase } from '@/integrations/supabase/client';
import { getLocalFileUrl, revokeLocalFileUrl, type FileMetadata } from '@/lib/file-storage';
import { cn } from '@/lib/utils';

interface ResourceInfo {
  id: string;
  title: string;
  subject: string;
  type: string;
  fileSize: string;
  fileUrl: string;
  language: string;
}

const ShareResourcesPage = () => {
  const navigate = useNavigate();
  const { allMeta } = useFileDownload();
  const { isOnline } = useOfflineStorage();
  const [resourceInfoMap, setResourceInfoMap] = useState<Record<string, ResourceInfo>>({});
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [qrResource, setQrResource] = useState<ResourceInfo | null>(null);
  const [exporting, setExporting] = useState<string | null>(null);
  const [exported, setExported] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);

  const downloadedMeta = allMeta.filter(m => m.status === 'downloaded');

  // Fetch resource info from DB
  useEffect(() => {
    const ids = downloadedMeta.map(m => m.contentId);
    if (ids.length === 0) return;

    const fetchInfo = async () => {
      const [videosRes, resourcesRes] = await Promise.all([
        supabase.from('videos').select('id, title, subject, file_size, video_url, language').in('id', ids),
        supabase.from('resources').select('id, title, subject, type, file_size, file_url, language').in('id', ids),
      ]);

      const map: Record<string, ResourceInfo> = {};
      videosRes.data?.forEach(v => {
        map[v.id] = { id: v.id, title: v.title, subject: v.subject, type: 'video', fileSize: v.file_size || '', fileUrl: v.video_url, language: v.language || 'en' };
      });
      resourcesRes.data?.forEach(r => {
        map[r.id] = { id: r.id, title: r.title, subject: r.subject, type: r.type, fileSize: r.file_size || '', fileUrl: r.file_url, language: r.language || 'en' };
      });
      setResourceInfoMap(map);
    };
    fetchInfo();
  }, [allMeta]);

  const toggleSelect = (id: string) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const getTypeIcon = (type: string) => {
    if (type === 'video') return Video;
    if (type === 'audio') return Music;
    return FileText;
  };

  // Export file: read from IndexedDB and trigger browser download
  const exportFile = useCallback(async (contentId: string, info: ResourceInfo) => {
    setExporting(contentId);
    try {
      const localUrl = await getLocalFileUrl(contentId);
      if (!localUrl) throw new Error('File not found in local storage');

      const response = await fetch(localUrl);
      const blob = await response.blob();
      revokeLocalFileUrl(localUrl);

      // Determine file extension
      const extMap: Record<string, string> = {
        video: '.mp4', pdf: '.pdf', audio: '.mp3', notes: '.pdf',
      };
      const ext = extMap[info.type] || '';
      const safeName = info.title.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
      const fileName = `CampusHub_${safeName}${ext}`;

      // Use Web Share API if available and on mobile
      if (navigator.share && navigator.canShare?.({ files: [new File([blob], fileName)] })) {
        const file = new File([blob], fileName, { type: blob.type });
        await navigator.share({
          title: info.title,
          text: `Shared from CampusHub: ${info.title} (${info.subject})`,
          files: [file],
        });
      } else {
        // Fallback: trigger download
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

      setExported(prev => new Set(prev).add(contentId));
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setExporting(null);
    }
  }, []);

  // Batch export selected items
  const exportSelected = useCallback(async () => {
    for (const id of selectedItems) {
      const info = resourceInfoMap[id];
      if (info) await exportFile(id, info);
    }
  }, [selectedItems, resourceInfoMap, exportFile]);

  // Show QR code for a resource
  const showQrCode = (info: ResourceInfo) => {
    setQrResource(info);
    setQrDialogOpen(true);
  };

  const copyLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/downloads')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-heading text-foreground flex items-center gap-2">
              <Share2 className="h-6 w-6 text-primary" />
              Share Resources
            </h1>
            <p className="text-sm text-muted-foreground">
              Export and share downloaded content with classmates
            </p>
          </div>
        </div>
        {selectedItems.size > 0 && (
          <Button onClick={exportSelected} className="gap-2">
            <FileDown className="h-4 w-4" />
            Export {selectedItems.size} Selected
          </Button>
        )}
      </div>

      {/* Sharing Methods Info */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-lg bg-primary/10">
                <FileDown className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">File Export</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Save files to your device and share via USB, messaging apps, or any file transfer method. Works completely offline.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-lg bg-accent/10">
                <QrCode className="h-5 w-5 text-accent-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">QR Code Link</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Generate a QR code with the download link. The recipient scans it when they have internet to download.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Downloaded Resources List */}
      {downloadedMeta.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Download className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Downloaded Resources</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Download videos and resources first, then you can share them with classmates.
            </p>
            <Button variant="outline" onClick={() => navigate('/downloads')}>
              Go to Downloads
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                Downloaded Content ({downloadedMeta.length})
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (selectedItems.size === downloadedMeta.length) {
                    setSelectedItems(new Set());
                  } else {
                    setSelectedItems(new Set(downloadedMeta.map(m => m.contentId)));
                  }
                }}
              >
                {selectedItems.size === downloadedMeta.length ? 'Deselect All' : 'Select All'}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {downloadedMeta.map(meta => {
              const info = resourceInfoMap[meta.contentId];
              const TypeIcon = getTypeIcon(info?.type || meta.contentType);
              const isSelected = selectedItems.has(meta.contentId);
              const isExportingThis = exporting === meta.contentId;
              const wasExported = exported.has(meta.contentId);

              return (
                <div
                  key={meta.contentId}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border transition-all",
                    isSelected ? "border-primary/40 bg-primary/5" : "hover:bg-muted/50"
                  )}
                >
                  {/* Select checkbox */}
                  <button
                    onClick={() => toggleSelect(meta.contentId)}
                    className={cn(
                      "w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors",
                      isSelected ? "bg-primary border-primary" : "border-muted-foreground/30 hover:border-primary"
                    )}
                  >
                    {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                  </button>

                  <div className="p-2 rounded-lg bg-muted">
                    <TypeIcon className="h-4 w-4 text-muted-foreground" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{info?.title || meta.fileName || meta.contentId}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{info?.subject || 'Unknown'}</span>
                      <span>•</span>
                      <span>{formatBytes(meta.sizeBytes)}</span>
                      <span>•</span>
                      <span className="capitalize">{info?.type || meta.contentType}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {/* QR Code button */}
                    {info?.fileUrl && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => showQrCode(info)}
                        title="Show QR Code"
                      >
                        <QrCode className="h-4 w-4" />
                      </Button>
                    )}

                    {/* Export button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      disabled={isExportingThis}
                      onClick={() => info && exportFile(meta.contentId, info)}
                      title="Export file"
                    >
                      {isExportingThis ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : wasExported ? (
                        <CheckCircle2 className="h-4 w-4 text-success" />
                      ) : (
                        <FileDown className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* LAN Sharing Info */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-muted">
              <AlertCircle className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold mb-1 text-sm">About LAN / Peer-to-Peer Sharing</h3>
              <p className="text-xs text-muted-foreground">
                Direct device-to-device sharing via Bluetooth or WiFi Direct is not supported by web browsers or Capacitor.
                Use <strong>File Export</strong> to save files, then share via USB, WhatsApp, Google Drive, or any file-sharing app.
                Use <strong>QR Code</strong> to generate download links for classmates with internet access.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* QR Code Dialog */}
      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Share via QR Code
            </DialogTitle>
            <DialogDescription>
              Scan this QR code to download the resource (internet required)
            </DialogDescription>
          </DialogHeader>
          {qrResource && (
            <div className="space-y-4">
              <div className="flex justify-center p-4 bg-white rounded-lg">
                <QRCodeSVG
                  value={qrResource.fileUrl}
                  size={200}
                  level="M"
                  includeMargin
                />
              </div>
              <div className="text-center space-y-1">
                <p className="font-medium text-sm">{qrResource.title}</p>
                <p className="text-xs text-muted-foreground">
                  {qrResource.subject} • {qrResource.type} • {qrResource.fileSize}
                </p>
              </div>
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => copyLink(qrResource.fileUrl)}
              >
                {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Link Copied!' : 'Copy Download Link'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ShareResourcesPage;
