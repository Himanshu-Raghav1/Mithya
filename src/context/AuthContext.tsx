import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface AuthUser {
  user_id: string;
  email: string;
  anon_name: string;
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

/** Decode JWT payload without verifying signature (client-side only) */
function decodeJwt(token: string): AuthUser | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    // Check expiry
    if (payload.exp * 1000 < Date.now()) return null;
    return { user_id: payload.user_id, email: payload.email, anon_name: payload.anon_name };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
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
    setIsLoading(false);
  }, []);

  const login = (newToken: string) => {
    const decoded = decodeJwt(newToken);
    if (decoded) {
      localStorage.setItem('mithya_token', newToken);
      setToken(newToken);
      setUser(decoded);
    }
  };

  const logout = () => {
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
