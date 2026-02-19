/**
 * Hook for managing real file downloads with offline storage
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  downloadFile,
  removeLocalFile,
  getLocalFileUrl,
  revokeLocalFileUrl,
  getFileMetadata,
  getAllFileMetadata,
  isFileDownloaded,
  getStorageUsed,
  type FileMetadata,
} from '@/lib/file-storage';
import { useOfflineStorage } from '@/hooks/use-offline-storage';

export type DownloadState = 'idle' | 'downloading' | 'downloaded' | 'failed';

interface DownloadInfo {
  state: DownloadState;
  progress: number;
  error?: string;
}

export const useFileDownload = () => {
  const [downloadStates, setDownloadStates] = useState<Record<string, DownloadInfo>>({});
  const [allMeta, setAllMeta] = useState<FileMetadata[]>([]);
  const [storageUsed, setStorageUsed] = useState(0);
  const { markAsDownloaded, removeDownload: removeFromOfflineStorage } = useOfflineStorage();

  // Load initial states from persisted metadata
  useEffect(() => {
    const loadStates = async () => {
      const metas = await getAllFileMetadata();
      setAllMeta(metas);
      const states: Record<string, DownloadInfo> = {};
      for (const m of metas) {
        states[m.contentId] = {
          state: m.status === 'downloaded' ? 'downloaded' : m.status === 'downloading' ? 'idle' : 'failed',
          progress: m.status === 'downloaded' ? 100 : 0,
          error: m.error,
        };
      }
      setDownloadStates(states);
      setStorageUsed(await getStorageUsed());
    };
    loadStates();
  }, []);

  const startDownload = useCallback(async (
    fileUrl: string,
    contentId: string,
    contentType: 'video' | 'resource',
    fileName?: string,
  ) => {
    const name = fileName || fileUrl.split('/').pop() || contentId;

    setDownloadStates(prev => ({
      ...prev,
      [contentId]: { state: 'downloading', progress: 0 },
    }));

    try {
      await downloadFile(fileUrl, contentId, contentType, name, (progress) => {
        setDownloadStates(prev => ({
          ...prev,
          [contentId]: { state: 'downloading', progress },
        }));
      });

      setDownloadStates(prev => ({
        ...prev,
        [contentId]: { state: 'downloaded', progress: 100 },
      }));

      // Also mark in the legacy offline storage for compatibility
      markAsDownloaded(contentId, contentType);

      // Refresh metadata
      const metas = await getAllFileMetadata();
      setAllMeta(metas);
      setStorageUsed(await getStorageUsed());
    } catch (err: any) {
      setDownloadStates(prev => ({
        ...prev,
        [contentId]: { state: 'failed', progress: 0, error: err.message },
      }));
    }
  }, [markAsDownloaded]);

  const removeFile = useCallback(async (contentId: string) => {
    await removeLocalFile(contentId);
    removeFromOfflineStorage(contentId);

    setDownloadStates(prev => {
      const next = { ...prev };
      delete next[contentId];
      return next;
    });

    const metas = await getAllFileMetadata();
    setAllMeta(metas);
    setStorageUsed(await getStorageUsed());
  }, [removeFromOfflineStorage]);

  const getDownloadState = useCallback((contentId: string): DownloadInfo => {
    return downloadStates[contentId] || { state: 'idle', progress: 0 };
  }, [downloadStates]);

  const retryDownload = useCallback(async (
    fileUrl: string,
    contentId: string,
    contentType: 'video' | 'resource',
    fileName?: string,
  ) => {
    await removeLocalFile(contentId);
    return startDownload(fileUrl, contentId, contentType, fileName);
  }, [startDownload]);

  return {
    startDownload,
    removeFile,
    getDownloadState,
    retryDownload,
    allMeta,
    storageUsed,
    getLocalFileUrl,
    revokeLocalFileUrl,
    isFileDownloaded,
  };
};

/**
 * Hook to get a local file URL for a specific content, with cleanup
 */
export const useLocalFileUrl = (contentId: string | undefined, remoteUrl: string) => {
  const [localUrl, setLocalUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLocal, setIsLocal] = useState(false);
  const urlRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!contentId) {
        setLocalUrl(null);
        setIsLocal(false);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const url = await getLocalFileUrl(contentId);
      
      if (cancelled) {
        if (url) revokeLocalFileUrl(url);
        return;
      }

      if (url) {
        urlRef.current = url;
        setLocalUrl(url);
        setIsLocal(true);
      } else {
        setLocalUrl(null);
        setIsLocal(false);
      }
      setIsLoading(false);
    };

    load();

    return () => {
      cancelled = true;
      if (urlRef.current) {
        revokeLocalFileUrl(urlRef.current);
        urlRef.current = null;
      }
    };
  }, [contentId]);

  // Return local URL if available, otherwise remote URL
  const effectiveUrl = isLocal && localUrl ? localUrl : remoteUrl;
  
  return { url: effectiveUrl, isLocal, isLoading };
};
