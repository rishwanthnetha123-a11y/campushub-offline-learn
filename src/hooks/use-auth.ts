import { useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, getUserRoles, AppRole } from '@/lib/supabase';

interface AuthState {
  user: User | null;
  session: Session | null;
  roles: AppRole[];
  isAdmin: boolean;
  isHod: boolean;
  isFaculty: boolean;
  isLoading: boolean;
}

function deriveFlags(roles: AppRole[]) {
  return {
    isAdmin: roles.includes('admin'),
    isHod: roles.includes('hod'),
    isFaculty: roles.includes('faculty'),
  };
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    roles: [],
    isAdmin: false,
    isHod: false,
    isFaculty: false,
    isLoading: true,
  });

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const user = session?.user ?? null;
        if (user) {
          setTimeout(async () => {
            const roles = await getUserRoles(user.id);
            setAuthState({ user, session, roles, ...deriveFlags(roles), isLoading: false });
          }, 0);
        } else {
          setAuthState({ user, session, roles: [], isAdmin: false, isHod: false, isFaculty: false, isLoading: false });
        }
      }
    );

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const user = session?.user ?? null;
      if (user) {
        const roles = await getUserRoles(user.id);
        setAuthState({ user, session, roles, ...deriveFlags(roles), isLoading: false });
      } else {
        setAuthState({ user, session, roles: [], isAdmin: false, isHod: false, isFaculty: false, isLoading: false });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
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

  const refreshRoles = useCallback(async () => {
    if (authState.user) {
      const roles = await getUserRoles(authState.user.id);
      setAuthState(prev => ({ ...prev, roles, ...deriveFlags(roles) }));
    }
  }, [authState.user]);

  return {
    ...authState,
    signIn,
    signUp,
    signOut,
    refreshAdminStatus: refreshRoles,
    refreshRoles,
  };
}
