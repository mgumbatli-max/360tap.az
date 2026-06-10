import type { User } from '@prisma/client';

export interface PublicUser {
  id: string;
  email: string | null;
  phone: string | null;
  fullName: string;
  role: User['role'];
  status: User['status'];
  avatarUrl: string | null;
  rating: number;
  reviewsCount: number;
  isPhoneVerified: boolean;
  isEmailVerified: boolean;
  createdAt: Date;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  accessExpiresIn: number;
}

export interface AuthResponse {
  user: PublicUser;
  tokens: AuthTokens;
}
