import { CheckCircle2, Download, Cloud, Loader2 } from 'lucide-react';
import { OfflineStatus } from '@/types/content';
import { cn } from '@/lib/utils';

interface OfflineStatusBadgeProps {
  status: OfflineStatus;
  downloadProgress?: number;
  className?: string;
}

const statusConfig: Record<OfflineStatus, { 
  label: string; 
  icon: React.ElementType; 
  className: string 
}> = {
  'offline-ready': {
    label: 'Offline Ready',
    icon: CheckCircle2,
    className: 'badge-offline-ready',
  },
  'downloaded': {
    label: 'Downloaded',
    icon: CheckCircle2,
    className: 'badge-downloaded',
  },
  'downloading': {
    label: 'Downloading',
    icon: Loader2,
    className: 'badge-downloading',
  },
  'needs-internet': {
    label: 'Needs Internet',
    icon: Cloud,
    className: 'badge-needs-internet',
  },
  'not-downloaded': {
    label: 'Available',
    icon: Download,
    className: 'bg-secondary text-secondary-foreground',
  },
};

export const OfflineStatusBadge = ({ 
  status, 
  downloadProgress, 
  className 
}: OfflineStatusBadgeProps) => {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className={cn(
      "inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium",
      config.className,
      className
    )}>
      <Icon className={cn(
        "h-3 w-3",
        status === 'downloading' && "animate-spin"
      )} />
      <span>{config.label}</span>
      {status === 'downloading' && downloadProgress !== undefined && (
        <span className="text-xs opacity-80">{downloadProgress}%</span>
      )}
    </div>
  );
};
