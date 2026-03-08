import { useState, useCallback } from 'react';
import { 
  FileText, ZoomIn, ZoomOut, ChevronLeft, ChevronRight,
  Download, ExternalLink, Moon, Sun, Share2, Copy, Check, Highlighter,
  RotateCcw, Maximize
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface PDFViewerProps {
  url: string;
  title: string;
  pages?: number;
  onProgress?: (currentPage: number, totalPages: number) => void;
  className?: string;
}

export const PDFViewer = ({
  url,
  title,
  pages = 1,
  onProgress,
  className,
}: PDFViewerProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [isLoading, setIsLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [highlightMode, setHighlightMode] = useState(false);
  const [copied, setCopied] = useState(false);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= pages) {
      setCurrentPage(page);
      onProgress?.(page, pages);
    }
  };

  const handleZoom = (delta: number) => {
    setZoom(prev => Math.min(250, Math.max(50, prev + delta)));
  };

  const resetZoom = () => setZoom(100);

  const openInNewTab = () => window.open(url, '_blank');

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title}.pdf`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Download started');
  };

  const handleShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch (e) {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Link copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    }
  }, [title, url]);

  const progressPercent = Math.round((currentPage / pages) * 100);

  return (
    <div className={cn("flex flex-col bg-muted rounded-xl overflow-hidden border", className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between p-2 sm:p-3 bg-card border-b gap-2 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="h-5 w-5 text-primary shrink-0" />
          <span className="font-medium text-sm truncate max-w-[180px]">{title}</span>
        </div>

        <div className="flex items-center gap-1 flex-wrap">
          {/* Pagination */}
          <div className="flex items-center gap-0.5 bg-muted rounded-lg px-1">
            <Button variant="ghost" size="icon" onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} className="h-8 w-8">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm min-w-[50px] text-center tabular-nums font-mono">
              {currentPage}/{pages}
            </span>
            <Button variant="ghost" size="icon" onClick={() => goToPage(currentPage + 1)} disabled={currentPage === pages} className="h-8 w-8">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Zoom */}
          <div className="flex items-center gap-0.5 border-l pl-1 ml-1">
            <Button variant="ghost" size="icon" onClick={() => handleZoom(-25)} className="h-8 w-8">
              <ZoomOut className="h-4 w-4" />
            </Button>
            <button onClick={resetZoom} className="text-xs min-w-[42px] text-center tabular-nums font-mono hover:text-primary transition-colors">
              {zoom}%
            </button>
            <Button variant="ghost" size="icon" onClick={() => handleZoom(25)} className="h-8 w-8">
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>

          {/* Tools */}
          <div className="flex items-center gap-0.5 border-l pl-1 ml-1">
            {/* Dark mode toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDarkMode(!darkMode)}
              className={cn("h-8 w-8", darkMode && "text-primary bg-primary/10")}
              title="Toggle dark mode"
            >
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            {/* Highlight toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setHighlightMode(!highlightMode);
                toast.info(highlightMode ? 'Highlight mode off' : 'Highlight mode on — select text to highlight');
              }}
              className={cn("h-8 w-8", highlightMode && "text-yellow-500 bg-yellow-500/10")}
              title="Toggle highlight mode"
            >
              <Highlighter className="h-4 w-4" />
            </Button>

            {/* Download */}
            <Button variant="ghost" size="icon" onClick={handleDownload} className="h-8 w-8" title="Download PDF">
              <Download className="h-4 w-4" />
            </Button>

            {/* Share */}
            <Button variant="ghost" size="icon" onClick={handleShare} className="h-8 w-8" title="Share link">
              {copied ? <Check className="h-4 w-4 text-green-500" /> : <Share2 className="h-4 w-4" />}
            </Button>

            {/* Open external */}
            <Button variant="ghost" size="icon" onClick={openInNewTab} className="h-8 w-8" title="Open in new tab">
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* PDF View */}
      <div className={cn(
        "flex-1 min-h-[500px] flex items-start justify-center overflow-auto p-4 transition-colors duration-300",
        darkMode ? "bg-zinc-900" : "bg-muted-foreground/5"
      )}>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted z-10">
            <div className="text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-2 animate-pulse" />
              <p className="text-sm text-muted-foreground">Loading PDF...</p>
            </div>
          </div>
        )}

        <div className={cn(
          "transition-all duration-300 rounded-lg shadow-lg overflow-hidden",
          darkMode && "invert hue-rotate-180"
        )}
          style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
        >
          <iframe
            src={`${url}#page=${currentPage}`}
            className="w-[800px] h-[1000px] bg-white border-0"
            onLoad={() => setIsLoading(false)}
            title={title}
          />
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-4 py-2 bg-card border-t">
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground tabular-nums font-mono min-w-[36px] text-right">
            {progressPercent}%
          </span>
        </div>
      </div>
    </div>
  );
};
