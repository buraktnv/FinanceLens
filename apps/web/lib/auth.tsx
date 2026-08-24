'use client';

import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { User, Session, SupabaseClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { createClient } from './supabase/client';
import { parseDemoUser } from './demo-user';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isDemo: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (
    email: string,
    password: string,
    name?: string
  ) => Promise<{ error: Error | null; session: Session | null }>;
  signInAsDemo: () => void;
  signOut: () => Promise<void>;
}

const DEMO_USER_KEY = 'financelens-demo-user';

const DEMO_USER: User = {
  id: 'demo-user',
  aud: 'authenticated',
  role: 'authenticated',
  email: 'demo@financelens.app',
  app_metadata: {},
  user_metadata: { name: 'Demo User' },
  identities: [],
  created_at: new Date().toISOString(),
} as unknown as User;

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Lazy getter for supabase client
function getSupabaseClient(): SupabaseClient | null {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    return createClient();
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const supabaseRef = useRef<SupabaseClient | null>(null);
  const router = useRouter();

  // Get or create supabase client
  const getClient = (): SupabaseClient | null => {
    if (!supabaseRef.current) {
      supabaseRef.current = getSupabaseClient();
    }
    return supabaseRef.current;
  };

  useEffect(() => {
    // Check for demo user in localStorage first
    if (typeof window !== 'undefined') {
      const rawDemoUser = window.localStorage.getItem(DEMO_USER_KEY);
      const demoUser = parseDemoUser(rawDemoUser);
      if (demoUser) {
        setUser(demoUser);
        setIsDemo(true);
        setLoading(false);
        return;
      }
      if (rawDemoUser) {
        // Corrupted value: treat as logged out and clear it
        window.localStorage.removeItem(DEMO_USER_KEY);
      }
    }

    const supabase = getClient();
    if (!supabase) {
      setLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Navigation is owned by callers: they route explicitly after awaiting
  // signIn/signUp. signInAsDemo keeps its own routing (demo mode has no
  // server session to guard).
  const signIn = async (email: string, password: string) => {
    const supabase = getClient();
    if (!supabase) {
      return { error: new Error('Supabase is not configured. Please check your environment variables.') };
    }
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string, name?: string) => {
    const supabase = getClient();
    if (!supabase) {
      return { error: new Error('Supabase is not configured. Please check your environment variables.'), session: null };
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
      },
    });
    // When email confirmation is required, signUp succeeds without a session;
    // callers must route to /login?message=confirm-email in that case.
    return { error, session: data?.session ?? null };
  };

  const signInAsDemo = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(DEMO_USER_KEY, JSON.stringify(DEMO_USER));
    }
    setUser(DEMO_USER);
    setIsDemo(true);
    setLoading(false);
    router.push('/dashboard');
    router.refresh();
  };

  const signOut = async () => {
    // Clear demo session
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(DEMO_USER_KEY);
    }
    if (isDemo) {
      setUser(null);
      setIsDemo(false);
      router.push('/login');
      router.refresh();
      return;
    }
    const supabase = getClient();
    if (!supabase) return;
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, isDemo, signIn, signUp, signInAsDemo, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Hook to get access token for API calls
export function useAccessToken() {
  const { session } = useAuth();
  return session?.access_token ?? null;
}
