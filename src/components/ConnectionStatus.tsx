import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { useOfflineStorage } from '@/hooks/use-offline-storage';
import { cn } from '@/lib/utils';

export const ConnectionStatus = () => {
  const { isOnline, isSyncing, syncPending } = useOfflineStorage();

  return (
    <div className={cn(
      "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
      isOnline 
        ? "bg-success/10 text-success" 
        : "bg-warning/10 text-warning"
    )}>
      {isOnline ? (
        <>
          <Wifi className="h-4 w-4" />
          <span>Online</span>
          {isSyncing && (
            <RefreshCw className="h-3 w-3 animate-spin" />
          )}
          {syncPending > 0 && !isSyncing && (
            <span className="text-xs bg-warning/20 px-1.5 rounded">
              {syncPending} pending
            </span>
          )}
        </>
      ) : (
        <>
          <WifiOff className="h-4 w-4 offline-pulse" />
          <span>Offline Mode</span>
        </>
      )}
    </div>
  );
};
