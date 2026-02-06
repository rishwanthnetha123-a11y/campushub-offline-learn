import { useState } from 'react';
import { 
  FileText, 
  ZoomIn, 
  ZoomOut, 
  ChevronLeft, 
  ChevronRight,
  Download,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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

  const goToPage = (page: number) => {
    if (page >= 1 && page <= pages) {
      setCurrentPage(page);
      onProgress?.(page, pages);
    }
  };

  const handleZoom = (delta: number) => {
    setZoom(prev => Math.min(200, Math.max(50, prev + delta)));
  };

  const openInNewTab = () => {
    window.open(url, '_blank');
  };

  return (
    <div className={cn("flex flex-col bg-muted rounded-lg overflow-hidden", className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between p-3 bg-card border-b">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-muted-foreground" />
          <span className="font-medium text-sm truncate max-w-[200px]">{title}</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Pagination */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm min-w-[60px] text-center">
              {currentPage} / {pages}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === pages}
              className="h-8 w-8"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Zoom */}
          <div className="flex items-center gap-1 border-l pl-2 ml-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleZoom(-10)}
              className="h-8 w-8"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm min-w-[40px] text-center">{zoom}%</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleZoom(10)}
              className="h-8 w-8"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 border-l pl-2 ml-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={openInNewTab}
              className="h-8 w-8"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* PDF View */}
      <div className="flex-1 min-h-[400px] bg-muted-foreground/10 flex items-center justify-center overflow-auto p-4">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <div className="text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-2 animate-pulse" />
              <p className="text-sm text-muted-foreground">Loading PDF...</p>
            </div>
          </div>
        )}
        
        <iframe
          src={`${url}#page=${currentPage}&zoom=${zoom}`}
          className="w-full h-full min-h-[500px] bg-white rounded shadow-lg"
          style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
          onLoad={() => setIsLoading(false)}
          title={title}
        />
      </div>

      {/* Progress indicator */}
      <div className="p-2 bg-card border-t">
        <div className="progress-track">
          <div 
            className="progress-fill"
            style={{ width: `${(currentPage / pages) * 100}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1 text-center">
          {Math.round((currentPage / pages) * 100)}% completed
        </p>
      </div>
    </div>
  );
};
