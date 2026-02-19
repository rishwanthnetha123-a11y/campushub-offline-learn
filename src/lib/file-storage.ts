/**
 * Platform-aware file storage service
 * - Web/PWA: Uses IndexedDB via localforage (blob storage)
 * - Android (Capacitor): Uses @capacitor/filesystem (base64 file storage)
 */
import localforage from 'localforage';

// Initialize IndexedDB store for file blobs
const fileStore = localforage.createInstance({
  name: 'campushub',
  storeName: 'downloaded_files',
  description: 'Offline file storage for CampusHub',
});

// Metadata store (lightweight, separate from large blobs)
const metaStore = localforage.createInstance({
  name: 'campushub',
  storeName: 'file_metadata',
  description: 'Download metadata',
});

export interface FileMetadata {
  contentId: string;
  contentType: 'video' | 'resource';
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  downloadedAt: string;
  status: 'downloading' | 'downloaded' | 'failed';
  progress: number;
  error?: string;
}

const isCapacitor = (): boolean => {
  return typeof (window as any)?.Capacitor !== 'undefined' &&
    (window as any)?.Capacitor?.isNativePlatform?.() === true;
};

// Get Capacitor Filesystem lazily
const getFilesystem = async () => {
  if (!isCapacitor()) return null;
  try {
    const { Filesystem, Directory } = await import('@capacitor/filesystem');
    return { Filesystem, Directory };
  } catch {
    return null;
  }
};

/**
 * Download a file from a URL and store it locally
 */
export const downloadFile = async (
  url: string,
  contentId: string,
  contentType: 'video' | 'resource',
  fileName: string,
  onProgress?: (progress: number) => void,
): Promise<void> => {
  // Update metadata to downloading
  const meta: FileMetadata = {
    contentId,
    contentType,
    fileName,
    mimeType: guessMimeType(fileName),
    sizeBytes: 0,
    downloadedAt: '',
    status: 'downloading',
    progress: 0,
  };
  await metaStore.setItem(contentId, meta);

  try {
    // Fetch the file as a blob with progress tracking
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const contentLength = response.headers.get('content-length');
    const total = contentLength ? parseInt(contentLength, 10) : 0;
    const reader = response.body?.getReader();

    if (!reader) {
      // Fallback: no streaming support
      const blob = await response.blob();
      await storeBlob(contentId, blob);
      meta.sizeBytes = blob.size;
      meta.status = 'downloaded';
      meta.progress = 100;
      meta.downloadedAt = new Date().toISOString();
      await metaStore.setItem(contentId, meta);
      onProgress?.(100);
      return;
    }

    // Stream download with progress
    const chunks: BlobPart[] = [];
    let received = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      received += value.length;
      const progress = total > 0 ? Math.round((received / total) * 100) : 0;
      meta.progress = progress;
      onProgress?.(progress);
    }

    // Combine chunks into blob
    const blob = new Blob(chunks, { type: guessMimeType(fileName) });
    await storeBlob(contentId, blob);

    meta.sizeBytes = blob.size;
    meta.status = 'downloaded';
    meta.progress = 100;
    meta.downloadedAt = new Date().toISOString();
    await metaStore.setItem(contentId, meta);
    onProgress?.(100);
  } catch (err: any) {
    meta.status = 'failed';
    meta.error = err.message || 'Download failed';
    await metaStore.setItem(contentId, meta);
    throw err;
  }
};

/**
 * Store blob using platform-appropriate method
 */
const storeBlob = async (contentId: string, blob: Blob): Promise<void> => {
  const cap = await getFilesystem();

  if (cap) {
    // Android: convert to base64 and write to filesystem
    const base64 = await blobToBase64(blob);
    await cap.Filesystem.writeFile({
      path: `campushub/${contentId}`,
      data: base64,
      directory: cap.Directory.Data,
      recursive: true,
    });
  } else {
    // Web/PWA: store in IndexedDB
    await fileStore.setItem(contentId, blob);
  }
};

/**
 * Retrieve a local URL for offline playback
 * Returns an object URL from the stored blob, or null if not found
 */
export const getLocalFileUrl = async (contentId: string): Promise<string | null> => {
  const meta = await getFileMetadata(contentId);
  if (!meta || meta.status !== 'downloaded') return null;

  const cap = await getFilesystem();

  if (cap) {
    try {
      const result = await cap.Filesystem.readFile({
        path: `campushub/${contentId}`,
        directory: cap.Directory.Data,
      });
      // Convert base64 back to blob URL
      const blob = base64ToBlob(result.data as string, meta.mimeType);
      return URL.createObjectURL(blob);
    } catch {
      return null;
    }
  } else {
    // Web/PWA: read from IndexedDB
    const blob = await fileStore.getItem<Blob>(contentId);
    if (!blob) return null;
    return URL.createObjectURL(blob);
  }
};

/**
 * Remove a downloaded file from local storage
 */
export const removeLocalFile = async (contentId: string): Promise<void> => {
  const cap = await getFilesystem();

  if (cap) {
    try {
      await cap.Filesystem.deleteFile({
        path: `campushub/${contentId}`,
        directory: cap.Directory.Data,
      });
    } catch { /* file might not exist */ }
  } else {
    await fileStore.removeItem(contentId);
  }

  await metaStore.removeItem(contentId);
};

/**
 * Get metadata for a downloaded file
 */
export const getFileMetadata = async (contentId: string): Promise<FileMetadata | null> => {
  return metaStore.getItem<FileMetadata>(contentId);
};

/**
 * Get all file metadata entries
 */
export const getAllFileMetadata = async (): Promise<FileMetadata[]> => {
  const items: FileMetadata[] = [];
  await metaStore.iterate<FileMetadata, void>((value) => {
    items.push(value);
  });
  return items;
};

/**
 * Check if a file is downloaded and ready for offline use
 */
export const isFileDownloaded = async (contentId: string): Promise<boolean> => {
  const meta = await getFileMetadata(contentId);
  return meta?.status === 'downloaded';
};

// ---- Utility functions ----

const guessMimeType = (fileName: string): string => {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  const mimeMap: Record<string, string> = {
    mp4: 'video/mp4',
    webm: 'video/webm',
    pdf: 'application/pdf',
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    ogg: 'audio/ogg',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
  };
  return mimeMap[ext] || 'application/octet-stream';
};

const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Remove data URL prefix
      resolve(result.split(',')[1] || result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

const base64ToBlob = (base64: string, mimeType: string): Blob => {
  const byteChars = atob(base64);
  const byteNumbers = new Uint8Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) {
    byteNumbers[i] = byteChars.charCodeAt(i);
  }
  return new Blob([byteNumbers.buffer], { type: mimeType });
};

/**
 * Revoke an object URL to free memory
 * Call this when the component using the URL unmounts
 */
export const revokeLocalFileUrl = (url: string): void => {
  if (url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
};

/**
 * Get total storage used by downloaded files
 */
export const getStorageUsed = async (): Promise<number> => {
  let total = 0;
  const metas = await getAllFileMetadata();
  for (const m of metas) {
    if (m.status === 'downloaded') total += m.sizeBytes;
  }
  return total;
};
