import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

export interface AuthUser {
  user_id: string;
  email: string;
  anon_name: string;
  needsAnonName: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null, token: null,
  login: () => {}, logout: () => {},
  isLoading: true,
});

/** Decode JWT payload without verifying signature (client-side display only) */
function decodeJwt(token: string): AuthUser | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.exp * 1000 < Date.now()) return null;
    
    // Get their real name from Google (if any)
    const realName = payload.user_metadata?.full_name || payload.user_metadata?.name;
    const currentAnon = payload.user_metadata?.anon_name || payload.anon_name;
    
    // Check if anon_name is missing, OR if it accidentally matches their real Google name
    const hasExplicitAnonName = !!currentAnon && currentAnon !== realName;
    
    return {
      user_id: payload.sub || payload.user_id,
      email: payload.email || '',
      anon_name: hasExplicitAnonName ? currentAnon : 'MithyaUser',
      needsAnonName: !hasExplicitAnonName
    };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // ✅ PRIMARY: Subscribe to Supabase session — auto-refreshes tokens silently
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.access_token) {
          const decoded = decodeJwt(session.access_token);
          if (decoded) {
            setToken(session.access_token);
            setUser(decoded);
            // Keep localStorage in sync for backwards compat
            localStorage.setItem('mithya_token', session.access_token);
          }
        } else {
          // Session ended or logged out
          setToken(null);
          setUser(null);
          localStorage.removeItem('mithya_token');
        }
        setIsLoading(false);
      }
    );

    // ✅ FALLBACK: check for existing session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.access_token) {
        const decoded = decodeJwt(session.access_token);
        if (decoded) {
          setToken(session.access_token);
          setUser(decoded);
          localStorage.setItem('mithya_token', session.access_token);
        }
      } else {
        // Try legacy stored token (auth_service.py flow)
        const stored = localStorage.getItem('mithya_token');
        if (stored) {
          const decoded = decodeJwt(stored);
          if (decoded) {
            setToken(stored);
            setUser(decoded);
          } else {
            localStorage.removeItem('mithya_token');
          }
        }
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  /** Called after OTP verify — Supabase session is already set, just sync state */
  const login = (newToken: string) => {
    const decoded = decodeJwt(newToken);
    if (decoded) {
      localStorage.setItem('mithya_token', newToken);
      setToken(newToken);
      setUser(decoded);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('mithya_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
