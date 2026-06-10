import type { UserRole } from '@prisma/client';

export interface JwtPayload {
  sub: string;        // user id
  email: string | null;
  role: UserRole;
  type: 'access' | 'refresh';
  iat?: number;
  exp?: number;
}
