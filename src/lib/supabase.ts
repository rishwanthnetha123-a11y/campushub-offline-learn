import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper to check if user is admin
export async function checkIsAdmin(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .eq('role', 'admin')
    .single();
  
  return !error && !!data;
}

// Type definitions for database tables
export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  preferred_language: string;
  created_at: string;
  updated_at: string;
}

export interface StudentProgress {
  id: string;
  user_id: string;
  content_id: string;
  content_type: 'video' | 'resource';
  progress: number;
  completed: boolean;
  completed_at: string | null;
  last_position: number;
  quiz_completed: boolean;
  quiz_score: number | null;
  created_at: string;
  updated_at: string;
}

export interface QuizAttempt {
  id: string;
  user_id: string;
  quiz_id: string;
  answers: number[];
  score: number;
  passed: boolean;
  completed_at: string;
}

export interface UserDownload {
  id: string;
  user_id: string;
  content_id: string;
  content_type: 'video' | 'resource';
  downloaded_at: string;
}

export interface DBVideo {
  id: string;
  title: string;
  description: string | null;
  duration: string | null;
  duration_seconds: number | null;
  resolution: string;
  file_size: string | null;
  file_size_bytes: number | null;
  subject: string;
  topic: string | null;
  thumbnail_url: string | null;
  video_url: string;
  instructor: string | null;
  display_order: number;
  is_active: boolean;
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface DBResource {
  id: string;
  title: string;
  description: string | null;
  type: 'pdf' | 'notes' | 'audio';
  file_size: string | null;
  file_size_bytes: number | null;
  subject: string;
  topic: string | null;
  file_url: string;
  pages: number | null;
  duration: string | null;
  is_active: boolean;
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminInvite {
  id: string;
  email: string;
  invited_by: string | null;
  invite_token: string;
  accepted: boolean;
  expires_at: string;
  created_at: string;
}
