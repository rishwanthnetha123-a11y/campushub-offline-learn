import { useState } from 'react';
import { Download, Loader2, Check, Trash2, AlertCircle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { DownloadState } from '@/hooks/use-file-download';

interface DownloadButtonProps {
  downloadState: DownloadState;
  progress: number;
  fileSize: string;
  error?: string;
  onDownload: () => void;
  onRemove: () => void;
  onRetry?: () => void;
  className?: string;
}

export const DownloadButton = ({
  downloadState,
  progress,
  fileSize,
  error,
  onDownload,
  onRemove,
  onRetry,
  className,
}: DownloadButtonProps) => {
  if (downloadState === 'downloaded') {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium badge-offline-ready">
          <Check className="h-4 w-4" />
          Offline Ready
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={onRemove}
          className="h-8 w-8 text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  if (downloadState === 'downloading') {
    return (
      <div className={cn("flex flex-col gap-1", className)}>
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-accent" />
          <span className="text-sm font-medium text-accent">
            Downloading... {Math.round(progress)}%
          </span>
        </div>
        <div className="progress-track">
          <div
            className="h-full bg-accent rounded-full transition-all duration-300"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      </div>
    );
  }

  if (downloadState === 'failed') {
    return (
      <div className={cn("flex flex-col gap-2", className)}>
        <div className="flex items-center gap-2 text-destructive">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm font-medium">Download failed</span>
        </div>
        {error && <p className="text-xs text-muted-foreground">{error}</p>}
        <Button variant="outline" size="sm" onClick={onRetry || onDownload} className="gap-2">
          <RotateCcw className="h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant="outline"
      onClick={onDownload}
      className={cn(
        "gap-2 hover:bg-accent hover:text-accent-foreground transition-colors",
        className
      )}
    >
      <Download className="h-4 w-4 download-bounce" />
      <span>Download</span>
      <span className="text-xs opacity-70">({fileSize})</span>
    </Button>
  );
};
