import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { UserRole } from '../types';
import { api, setAuthToken, getAuthToken, setUnauthorizedHandler } from '../api/client';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  language: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isRestoring: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: { email: string; password: string; name: string; role: UserRole; language?: string }) => Promise<void>;
  logout: () => void;
  authError: string | null;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = localStorage.getItem('sahaaya_auth_user');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        /* ignore */
      }
    }
    return null;
  });
  const [isRestoring, setIsRestoring] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const persistUser = (u: AuthUser | null) => {
    setUser(u);
    if (u) localStorage.setItem('sahaaya_auth_user', JSON.stringify(u));
    else localStorage.removeItem('sahaaya_auth_user');
  };

  const logout = useCallback(() => {
    setAuthToken(null);
    persistUser(null);
  }, []);

  // Revalidate any stored session against the server on load; fall back to
  // cached user if offline so the app still opens without a network call.
  useEffect(() => {
    setUnauthorizedHandler(() => persistUser(null));
    const token = getAuthToken();
    if (!token) {
      setIsRestoring(false);
      return;
    }
    api
      .get<{ user: AuthUser }>('/auth/me')
      .then(({ user: fresh }) => persistUser(fresh))
      .catch(() => {
        /* offline or expired — keep cached user if any, AppContext falls back to local cache too */
      })
      .finally(() => setIsRestoring(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setAuthError(null);
    try {
      const { token, user: loggedIn } = await api.post<{ token: string; user: AuthUser }>('/auth/login', { email, password });
      setAuthToken(token);
      persistUser(loggedIn);
    } catch (err) {
      setAuthError((err as Error).message);
      throw err;
    }
  }, []);

  const register = useCallback(
    async (input: { email: string; password: string; name: string; role: UserRole; language?: string }) => {
      setAuthError(null);
      try {
        const { token, user: created } = await api.post<{ token: string; user: AuthUser }>('/auth/register', input);
        setAuthToken(token);
        persistUser(created);
      } catch (err) {
        setAuthError((err as Error).message);
        throw err;
      }
    },
    [],
  );

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isRestoring, login, register, logout, authError }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
