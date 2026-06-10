'use client';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api } from './api';

export type User = {
  id: string;
  email?: string | null;
  phone?: string | null;
  fullName?: string;
  full_name: string; // köhnə komponentlər üçün uyğunluq
  role: string;
  city?: string;
  avatarUrl?: string | null;
  avatar_url?: string | null;
  rating?: number;
  reviews_count?: number;
};

// NestJS camelCase → köhnə komponentlərin snake_case-i ilə uyğunlaşdır
function normalize(u: Record<string, any>): User {
  return {
    ...u,
    id: u.id,
    role: u.role ?? 'user',
    fullName: u.fullName ?? u.full_name,
    full_name: u.fullName ?? u.full_name ?? '',
    avatar_url: u.avatarUrl ?? u.avatar_url ?? null,
    avatarUrl: u.avatarUrl ?? u.avatar_url ?? null,
    reviews_count: u.reviewsCount ?? u.reviews_count ?? 0,
  } as User;
}

type AuthCtx = {
  user: User | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  register: (data: {
    full_name: string;
    email?: string;
    phone?: string;
    password: string;
    city?: string;
  }) => Promise<void>;
  logout: () => void;
};

const Ctx = createContext<AuthCtx | null>(null);

type AuthPayload = { user: Record<string, any>; tokens: { accessToken: string } };

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('avito_token');
    if (!token) {
      setLoading(false);
      return;
    }
    // NestJS: { ok, data: PublicUser }
    api<{ data?: Record<string, any> }>('/auth/me')
      .then((d) => setUser(normalize(d.data ?? d)))
      .catch(() => localStorage.removeItem('avito_token'))
      .finally(() => setLoading(false));
  }, []);

  const login = async (identifier: string, password: string) => {
    const d = await api<{ data?: AuthPayload }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    });
    const payload = (d.data ?? d) as unknown as AuthPayload;
    localStorage.setItem('avito_token', payload.tokens.accessToken);
    setUser(normalize(payload.user));
  };

  const register: AuthCtx['register'] = async (data) => {
    const body: Record<string, string> = {
      fullName: data.full_name,
      password: data.password,
    };
    if (data.email) body.email = data.email;
    if (data.phone) body.phone = data.phone;
    const d = await api<{ data?: AuthPayload }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    const payload = (d.data ?? d) as unknown as AuthPayload;
    localStorage.setItem('avito_token', payload.tokens.accessToken);
    setUser(normalize(payload.user));
  };

  const logout = () => {
    localStorage.removeItem('avito_token');
    setUser(null);
    location.href = '/';
  };

  return (
    <Ctx.Provider value={{ user, loading, login, register, logout }}>{children}</Ctx.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
