import { useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, checkIsAdmin } from '@/lib/supabase';

interface AuthState {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  isLoading: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    isAdmin: false,
    isLoading: true,
  });

  useEffect(() => {
    // Set up auth state listener BEFORE getting session
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const user = session?.user ?? null;
        let isAdmin = false;
        
        if (user) {
          // Use setTimeout to avoid potential deadlock
          setTimeout(async () => {
            isAdmin = await checkIsAdmin(user.id);
            setAuthState({ user, session, isAdmin, isLoading: false });
          }, 0);
        } else {
          setAuthState({ user, session, isAdmin: false, isLoading: false });
        }
      }
    );

    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const user = session?.user ?? null;
      let isAdmin = false;
      
      if (user) {
        isAdmin = await checkIsAdmin(user.id);
      }
      
      setAuthState({ user, session, isAdmin, isLoading: false });
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  }, []);

  const signUp = useCallback(async (email: string, password: string, fullName?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: fullName },
      },
    });
    return { data, error };
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  }, []);

  const refreshAdminStatus = useCallback(async () => {
    if (authState.user) {
      const isAdmin = await checkIsAdmin(authState.user.id);
      setAuthState(prev => ({ ...prev, isAdmin }));
    }
  }, [authState.user]);

  return {
    ...authState,
    signIn,
    signUp,
    signOut,
    refreshAdminStatus,
  };
}
