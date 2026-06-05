/**
 * AuthContext - Centralized Authentication State Management
 * 
 * This context provides a single source of truth for authentication state across the application.
 * It manages user session, profile data, and organization information.
 * 
 * @module AuthContext
 * 
 * Features:
 * - Automatic session management with Supabase
 * - Real-time auth state synchronization
 * - Profile and organization data caching
 * - Performance monitoring in development mode
 * - Turkish error messages
 * 
 * Usage:
 * ```tsx
 * import { useAuth } from '@/lib/contexts/AuthContext';
 * 
 * function MyComponent() {
 *   const { user, profile, organization, loading, error } = useAuth();
 *   
 *   if (loading) return <div>Yükleniyor...</div>;
 *   if (error) return <div>Hata: {error}</div>;
 *   if (!user) return <div>Giriş yapılmamış</div>;
 *   
 *   return <div>Hoş geldin, {profile?.name}!</div>;
 * }
 * ```
 * 
 * Migration Notes:
 * - Replaces old useAuth hook pattern (lib/hooks/useAuth.ts)
 * - Eliminates duplicate auth queries across components
 * - Reduces auth fetch from 4-6 queries to 1 query per page
 * - Provides consistent auth state across all components
 * 
 * @see {@link useAuth} - Hook to access auth context
 * @see {@link AuthProvider} - Provider component to wrap app
 */

'use client';

import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import type { Profile, Organization } from '@/lib/types';

// Auth state interface
interface AuthState {
  user: User | null;
  profile: Profile | null;
  organization: Organization | null;
  loading: boolean;
  error: string | null;
}

// Context value interface
interface AuthContextValue extends AuthState {
  isAuthenticated: boolean;
  signOut: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

// Error types
enum AuthErrorType {
  SESSION_FETCH_ERROR = 'SESSION_FETCH_ERROR',
  PROFILE_FETCH_ERROR = 'PROFILE_FETCH_ERROR',
  ORGANIZATION_FETCH_ERROR = 'ORGANIZATION_FETCH_ERROR',
  SIGNOUT_ERROR = 'SIGNOUT_ERROR',
}

// Turkish error messages
const ERROR_MESSAGES: Record<AuthErrorType, string> = {
  SESSION_FETCH_ERROR: 'Oturum bilgileri alınamadı',
  PROFILE_FETCH_ERROR: 'Profil bilgileri alınamadı',
  ORGANIZATION_FETCH_ERROR: 'Organizasyon bilgileri alınamadı',
  SIGNOUT_ERROR: 'Çıkış yapılırken bir hata oluştu',
};

// Create context
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Initial state
const initialState: AuthState = {
  user: null,
  profile: null,
  organization: null,
  loading: true,
  error: null,
};

// Provider props
interface AuthProviderProps {
  children: React.ReactNode;
}

// Timeout utility for Supabase queries
async function fetchWithTimeout<T>(
  queryFn: () => Promise<T>,
  timeoutMs: number,
  errorMessage: string
): Promise<T> {
  let timeoutId: NodeJS.Timeout;
  
  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(errorMessage));
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([queryFn(), timeoutPromise]);
    clearTimeout(timeoutId!);
    return result;
  } catch (error) {
    clearTimeout(timeoutId!);
    throw error;
  }
}

export function AuthProvider({ children }: AuthProviderProps) {
  // DEBUG LOGLARI - Environment variables kontrolü
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  console.log('[DEBUG Environment] URL defined?', !!url);
  console.log('[DEBUG Environment] URL value starts with:', url ? url.substring(0, 15) + '...' : 'UNDEFINED');
  console.log('[DEBUG Environment] Key defined?', !!key);
  console.log('[DEBUG Environment] Key value starts with:', key ? key.substring(0, 15) + '...' : 'UNDEFINED');
  
  // Singleton Supabase client - createClient zaten singleton pattern kullanıyor
  // useMemo'ya gerek yok, her çağrıda aynı instance döner
  const supabase = createClient();
  console.log('[DEBUG Supabase] Client created/retrieved:', !!supabase);
  
  // Auth state
  const [state, setState] = useState<AuthState>(initialState);

  // Load user data (profile + organization)
  const loadUserData = useCallback(async (user: User) => {
    const startTime = performance.now();
    try {
      // Optimization: Eğer zaten bu kullanıcı yüklüyse tekrar yükleme
      if (state.profile && state.user?.id === user.id) {
        console.log('[AuthContext] User data already loaded, skipping fetch');
        setState(prev => ({ ...prev, loading: false }));
        return;
      }

      console.log('[AuthContext] Starting auth data fetch...');
      console.log('[AuthContext] User ID:', user.id);
      
      // 1. Fetch profile with timeout
      console.log('[AuthContext] Fetching profile...');
      const profileResult = await fetchWithTimeout(
        async () => {
          const result = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
          return result;
        },
        1000, // 1 saniye timeout
        'Profil bilgileri yüklenirken zaman aşımı (1 saniye)'
      );

      const { data: profile, error: profileError } = profileResult;
      console.log('[AuthContext] Profile response:', { profile, error: profileError });

      if (profileError) throw profileError;
      if (!profile) throw new Error('Profile not found');

      // 2. Fetch organization with timeout
      console.log('[AuthContext] Fetching organization:', profile.organization_id);
      const orgResult = await fetchWithTimeout(
        async () => {
          const result = await supabase
            .from('organizations')
            .select('*')
            .eq('id', profile.organization_id)
            .single();
          return result;
        },
        1000, // 1 saniye timeout
        'Organizasyon bilgileri yüklenirken zaman aşımı (1 saniye)'
      );

      const { data: organization, error: orgError } = orgResult;
      console.log('[AuthContext] Organization response:', { organization, error: orgError });

      if (orgError) throw orgError;

      // Update state atomically
      setState({
        user,
        profile,
        organization,
        loading: false,
        error: null,
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      console.log(`[AuthContext] ✅ Auth data loaded successfully in ${duration.toFixed(2)}ms`);
      if (duration > 500) {
        console.warn(`[AuthContext] ⚠️ Auth fetch took longer than 500ms: ${duration.toFixed(2)}ms`);
      }
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      console.error(`[AuthContext] ❌ Error loading user data (${duration.toFixed(2)}ms):`, error instanceof Error ? error : JSON.stringify(error));
      
      // Set error state
      setState(prev => ({
        ...prev,
        user, // User var ama profil yoksa yine de user kalsın
        loading: false,
        error: error instanceof Error ? error.message : ERROR_MESSAGES.PROFILE_FETCH_ERROR,
      }));
    }
  }, [supabase, state.profile, state.user?.id]);

  // Handle auth state changes
  const handleAuthStateChange = useCallback(async (event: string, session: any) => {
    console.log('[AuthContext] Auth state changed:', event);
    console.log('[AuthContext] Session:', session?.user?.id || 'No user');

    if (session?.user) {
      console.log('[AuthContext] Session user found, loading user data...');
      await loadUserData(session.user);
    } else {
      console.log('[AuthContext] No session user, clearing state...');
      // User logged out
      setState({
        user: null,
        profile: null,
        organization: null,
        loading: false,
        error: null,
      });
    }
  }, [loadUserData]);

  // Sign out function
  const signOut = useCallback(async () => {
    try {
      // Clear state first for immediate UI update
      setState({
        user: null,
        profile: null,
        organization: null,
        loading: false,
        error: null,
      });

      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }

      console.log('[AuthContext] Sign out successful');
    } catch (error) {
      console.error('[AuthContext] Sign out error:', error);
      setState(prev => ({
        ...prev,
        error: ERROR_MESSAGES.SIGNOUT_ERROR,
      }));
    }
  }, [supabase]);

  // Refresh auth data
  const refreshAuth = useCallback(async () => {
    if (state.user) {
      setState(prev => ({ ...prev, loading: true }));
      await loadUserData(state.user);
    }
  }, [state.user, loadUserData]);

  // Listen to auth state changes
  // onAuthStateChange otomatik olarak mevcut session'ı kontrol eder ve INITIAL_SESSION event'i tetikler
  useEffect(() => {
    console.log('[AuthContext] Setting up auth listener...');
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      handleAuthStateChange
    );

    return () => {
      console.log('[AuthContext] Unsubscribing from auth changes');
      subscription.unsubscribe();
    };
  }, [handleAuthStateChange, supabase]);

  // Memoize context value
  const contextValue = useMemo<AuthContextValue>(
    () => ({
      user: state.user,
      profile: state.profile,
      organization: state.organization,
      loading: state.loading,
      error: state.error,
      isAuthenticated: !!state.user,
      signOut,
      refreshAuth,
    }),
    [state, signOut, refreshAuth]
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * useAuth Hook
 * 
 * Custom hook to access authentication context.
 * Must be used within AuthProvider component tree.
 * 
 * @returns {AuthContextValue} Authentication state and methods
 * @throws {Error} If used outside AuthProvider
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { user, profile, organization, loading, isAuthenticated, signOut } = useAuth();
 *   
 *   if (loading) return <Spinner />;
 *   if (!isAuthenticated) return <LoginPrompt />;
 *   
 *   return (
 *     <div>
 *       <h1>Welcome, {profile?.name}!</h1>
 *       <p>Organization: {organization?.name}</p>
 *       <button onClick={signOut}>Çıkış Yap</button>
 *     </div>
 *   );
 * }
 * ```
 * 
 * Available Properties:
 * - user: Supabase User object (null if not authenticated)
 * - profile: User profile from database (role, name, etc.)
 * - organization: Organization data
 * - loading: Boolean indicating if auth is being fetched
 * - error: Error message (Turkish) if auth fetch failed
 * - isAuthenticated: Computed boolean (true if user exists)
 * - signOut: Function to logout user
 * - refreshAuth: Function to manually refresh auth data
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  
  return context;
}
