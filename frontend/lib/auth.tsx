'use client';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api } from './api';

export type User = {
  id: string;
  email?: string;
  phone?: string;
  full_name: string;
  role: string;
  city?: string;
  avatar_url?: string;
  rating?: number;
  reviews_count?: number;
};

type AuthCtx = {
  user: User | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  register: (data: { full_name: string; email?: string; phone?: string; password: string; city?: string }) => Promise<void>;
  logout: () => void;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('avito_token');
    if (!token) { setLoading(false); return; }
    api<{ user: User }>('/auth/me')
      .then((d) => setUser(d.user))
      .catch(() => localStorage.removeItem('avito_token'))
      .finally(() => setLoading(false));
  }, []);

  const login = async (identifier: string, password: string) => {
    const d = await api<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    });
    localStorage.setItem('avito_token', d.token);
    setUser(d.user);
  };

  const register: AuthCtx['register'] = async (data) => {
    const d = await api<{ token: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    localStorage.setItem('avito_token', d.token);
    setUser(d.user);
  };

  const logout = () => {
    localStorage.removeItem('avito_token');
    setUser(null);
    location.href = '/';
  };

  return <Ctx.Provider value={{ user, loading, login, register, logout }}>{children}</Ctx.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
