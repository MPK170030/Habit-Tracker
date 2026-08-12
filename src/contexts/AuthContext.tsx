import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { api } from '../lib/api';
import type { ApiUser } from '../lib/api';

interface AuthContextValue {
  user:     ApiUser | null;
  token:    string | null;
  loading:  boolean;
  login:    (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, warriorName?: string) => Promise<void>;
  logout:   () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = 'wh_token';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token,   setToken]   = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [user,    setUser]    = useState<ApiUser | null>(null);
  const [loading, setLoading] = useState(true);

  // On mount, validate the stored token
  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    api.auth.me()
      .then(setUser)
      .catch(() => {
        // Token is invalid or expired — clear it
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
      })
      .finally(() => setLoading(false));
  }, []);

  function persist(t: string, u: ApiUser) {
    localStorage.setItem(TOKEN_KEY, t);
    setToken(t);
    setUser(u);
  }

  async function login(email: string, password: string) {
    const { token: t, user: u } = await api.auth.login(email, password);
    persist(t, u);
  }

  async function register(name: string, email: string, password: string, warriorName?: string) {
    const { token: t, user: u } = await api.auth.register(name, email, password, warriorName);
    persist(t, u);
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
