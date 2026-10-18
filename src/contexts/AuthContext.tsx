import { createContext, useContext, useState, ReactNode, useEffect, useCallback, useRef } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';

export type Role = 'admin' | 'manager' | 'employee';

interface User {
  id: string;
  username: string;
  email: string;
  role: Role | 'unknown';
  name: string;
}

interface AuthContextType {
  user: User | null;
  /** Validates credentials with Supabase Auth, then loads the profile/role. */
  signIn: (email: string, password: string, remember?: boolean) => Promise<User>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const isAdminRole = (role?: string) => role === 'admin' || role === 'manager';
export const homeForRole = (role?: string) => (isAdminRole(role) ? '/dashboard' : role === 'employee' ? '/employee' : '/acces-refuse');

const REMEMBER_KEY = 'auth:remember';
const ALIVE_KEY = 'auth:alive';

async function loadProfile(session: Session): Promise<User> {
  const authUser = session.user;
  let profile: { username?: string; role?: string } | null = null;
  try {
    const { data } = await supabase.from('users').select('username, role').eq('id', authUser.id).maybeSingle();
    profile = data;
  } catch { /* profile table unreachable — handled below */ }
  // Accounts created before roles existed have no profile row: they are the shop owner (admin).
  const rawRole = profile?.role ?? 'admin';
  const role: User['role'] = ['admin', 'manager', 'employee'].includes(rawRole) ? (rawRole as Role) : 'unknown';
  const username = profile?.username || authUser.email?.split('@')[0] || 'Utilisateur';
  return { id: authUser.id, email: authUser.email || '', username, name: username, role };
}

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const signingIn = useRef(false);

  useEffect(() => {
    let alive = true;
    // Clean up the old insecure localStorage "session" from previous versions.
    localStorage.removeItem('user');
    localStorage.removeItem('authTimestamp');

    // Never leave the app stuck on the loader (slow network, hung token refresh…).
    const safety = setTimeout(() => { if (alive) setIsLoading(false); }, 8000);

    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        let session = data.session;
        // "Se souvenir de moi" unchecked → the session ends with the browser session.
        if (session && localStorage.getItem(REMEMBER_KEY) === '0' && !sessionStorage.getItem(ALIVE_KEY)) {
          await supabase.auth.signOut();
          session = null;
        }
        if (session) {
          const u = await loadProfile(session);
          if (alive) setUser(u);
        }
      } catch { /* treat as signed out */ }
      finally {
        clearTimeout(safety);
        if (alive) setIsLoading(false);
      }
    })();

    // The callback must stay synchronous: awaiting Supabase calls inside it deadlocks the
    // auth lock (getSession() never resolves → infinite loader). Defer the profile load.
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (signingIn.current) return; // signIn() sets the user itself
      if (event === 'SIGNED_OUT' || !session) { setUser(null); return; }
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        setTimeout(() => {
          loadProfile(session).then((u) => { if (alive) setUser(u); }).catch(() => {});
        }, 0);
      }
    });
    return () => { alive = false; clearTimeout(safety); sub.subscription.unsubscribe(); };
  }, []);

  const signIn = useCallback(async (email: string, password: string, remember = true) => {
    signingIn.current = true;
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error || !data.session) throw error || new Error('Connexion impossible');
      localStorage.setItem(REMEMBER_KEY, remember ? '1' : '0');
      sessionStorage.setItem(ALIVE_KEY, '1');
      const u = await loadProfile(data.session);
      setUser(u);
      return u;
    } finally {
      signingIn.current = false;
    }
  }, []);

  const logout = useCallback(async () => {
    setUser(null);
    sessionStorage.removeItem(ALIVE_KEY);
    try { await supabase.auth.signOut(); } catch { /* already signed out */ }
  }, []);

  return (
    <AuthContext.Provider value={{ user, signIn, logout, isAuthenticated: user !== null, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
