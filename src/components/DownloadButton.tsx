import { useState, useEffect } from 'react';
import { Download, Loader2, Check, Trash2, HardDrive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DownloadButtonProps {
  isDownloaded: boolean;
  fileSize: string;
  onDownload: () => void;
  onRemove: () => void;
  className?: string;
}

export const DownloadButton = ({
  isDownloaded,
  fileSize,
  onDownload,
  onRemove,
  className,
}: DownloadButtonProps) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleDownload = async () => {
    setIsDownloading(true);
    setProgress(0);

    // Simulate download progress for demo
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsDownloading(false);
          onDownload();
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 200);
  };

  if (isDownloaded) {
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

  if (isDownloading) {
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
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <Button
      variant="outline"
      onClick={handleDownload}
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
