import { createContext, useContext, ReactNode } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { User, Session } from '@supabase/supabase-js';
import { AppRole } from '@/lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  roles: AppRole[];
  isAdmin: boolean;
  isHod: boolean;
  isFaculty: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ data: any; error: any }>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ data: any; error: any }>;
  signOut: () => Promise<{ error: any }>;
  refreshAdminStatus: () => Promise<void>;
  refreshRoles: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
