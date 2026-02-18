// CampusHub Content Types for Offline-First Learning

export interface Video {
  id: string;
  title: string;
  description: string;
  duration: string; // e.g., "8:45"
  durationSeconds: number;
  resolution: '360p' | '480p';
  fileSize: string; // e.g., "45 MB"
  fileSizeBytes: number;
  subject: string;
  topic: string;
  thumbnailUrl: string;
  videoUrl: string;
  instructor: string;
  order: number;
  language?: string;
}

export interface Resource {
  id: string;
  title: string;
  description: string;
  type: 'pdf' | 'notes' | 'audio';
  fileSize: string;
  fileSizeBytes: number;
  subject: string;
  topic: string;
  fileUrl: string;
  pages?: number; // For PDFs
  duration?: string; // For audio
  language?: string;
}

export interface Quiz {
  id: string;
  contentId: string; // Video or resource it's tied to
  contentType: 'video' | 'resource';
  title: string;
  questions: QuizQuestion[];
  passingScore: number; // Percentage to pass
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number; // Index of correct option
  explanation: string;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  answers: number[];
  score: number;
  passed: boolean;
  completedAt: string;
}

export interface DownloadedContent {
  id: string;
  contentId: string;
  contentType: 'video' | 'resource';
  downloadedAt: string;
  lastAccessedAt: string;
  localPath?: string; // For actual file storage
}

export interface LearningProgress {
  id: string;
  contentId: string;
  contentType: 'video' | 'resource';
  progress: number; // 0-100
  completed: boolean;
  completedAt?: string;
  lastPosition?: number; // For video playback position in seconds
  quizCompleted: boolean;
  quizScore?: number;
}

export interface SyncQueueItem {
  id: string;
  action: 'download' | 'progress' | 'quiz' | 'ticket' | 'ticket_message';
  data: unknown;
  createdAt: string;
  retries: number;
}

export type OfflineStatus = 'offline-ready' | 'downloaded' | 'downloading' | 'needs-internet' | 'not-downloaded';

export interface ContentWithStatus extends Video {
  offlineStatus: OfflineStatus;
  downloadProgress?: number;
  learningProgress?: number;
  quizAvailable: boolean;
  quizCompleted: boolean;
}

export interface ResourceWithStatus extends Resource {
  offlineStatus: OfflineStatus;
  downloadProgress?: number;
  learningProgress?: number;
}
