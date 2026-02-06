import { 
  Video, 
  FileText, 
  Music, 
  StickyNote,
  Clock,
  HardDrive,
  User
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Video as VideoType, Resource } from '@/types/content';
import { OfflineStatusBadge } from './OfflineStatusBadge';
import { ProgressRing } from './ProgressRing';
import { DownloadButton } from './DownloadButton';
import { cn } from '@/lib/utils';

interface ContentCardProps {
  content: VideoType | Resource;
  type: 'video' | 'resource';
  isDownloaded: boolean;
  learningProgress?: number;
  quizCompleted?: boolean;
  onDownload: () => void;
  onRemove: () => void;
  onClick: () => void;
  className?: string;
}

const getResourceIcon = (type: string) => {
  switch (type) {
    case 'pdf':
      return FileText;
    case 'audio':
      return Music;
    case 'notes':
      return StickyNote;
    default:
      return FileText;
  }
};

export const ContentCard = ({
  content,
  type,
  isDownloaded,
  learningProgress = 0,
  quizCompleted = false,
  onDownload,
  onRemove,
  onClick,
  className,
}: ContentCardProps) => {
  const isVideo = type === 'video';
  const video = content as VideoType;
  const resource = content as Resource;
  
  const Icon = isVideo ? Video : getResourceIcon(resource.type);

  return (
    <Card 
      className={cn(
        "group hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden",
        isDownloaded && "ring-2 ring-success/20",
        className
      )}
      onClick={onClick}
    >
      {/* Thumbnail / Icon area */}
      <div className="relative bg-muted h-32 flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        
        <Icon className="h-12 w-12 text-muted-foreground/50" />
        
        {/* Status badge */}
        <div className="absolute top-2 right-2">
          <OfflineStatusBadge 
            status={isDownloaded ? 'offline-ready' : 'not-downloaded'} 
          />
        </div>

        {/* Duration / Info */}
        <div className="absolute bottom-2 left-2 flex items-center gap-2 text-white text-xs">
          {isVideo ? (
            <>
              <Clock className="h-3 w-3" />
              <span>{video.duration}</span>
              <span className="opacity-70">• {video.resolution}</span>
            </>
          ) : (
            <>
              <HardDrive className="h-3 w-3" />
              <span>{resource.fileSize}</span>
              {resource.pages && <span className="opacity-70">• {resource.pages} pages</span>}
              {resource.duration && <span className="opacity-70">• {resource.duration}</span>}
            </>
          )}
        </div>

        {/* Progress ring overlay */}
        {learningProgress > 0 && learningProgress < 100 && (
          <div className="absolute bottom-2 right-2">
            <ProgressRing progress={learningProgress} size={32} strokeWidth={3} />
          </div>
        )}

        {/* Completed checkmark */}
        {learningProgress >= 100 && (
          <div className="absolute bottom-2 right-2 bg-success text-success-foreground rounded-full p-1">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
      </div>

      <CardContent className="p-4">
        {/* Subject badge */}
        <div className="text-xs font-medium text-primary mb-1">
          {content.subject}
        </div>

        {/* Title */}
        <h3 className="font-semibold text-foreground mb-1 line-clamp-2 group-hover:text-primary transition-colors">
          {content.title}
        </h3>

        {/* Description */}
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
          {content.description}
        </p>

        {/* Instructor (for videos) */}
        {isVideo && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
            <User className="h-3 w-3" />
            <span>{video.instructor}</span>
          </div>
        )}

        {/* Download button */}
        <div onClick={(e) => e.stopPropagation()}>
          <DownloadButton
            isDownloaded={isDownloaded}
            fileSize={content.fileSize}
            onDownload={onDownload}
            onRemove={onRemove}
          />
        </div>

        {/* Quiz indicator */}
        {isVideo && (
          <div className="mt-3 pt-3 border-t flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Quiz available</span>
            {quizCompleted ? (
              <span className="text-success font-medium">✓ Completed</span>
            ) : learningProgress >= 100 ? (
              <span className="text-primary font-medium">Ready to take</span>
            ) : (
              <span className="text-muted-foreground">Complete video first</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
