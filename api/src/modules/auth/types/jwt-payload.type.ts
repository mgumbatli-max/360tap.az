import type { UserRole } from '@prisma/client';

export interface JwtPayload {
  sub: string;        // user id
  email: string | null;
  role: UserRole;
  type: 'access' | 'refresh';
  /**
   * Yalnız refresh token-lərdə: unikal token identifikatoru.
   * Faza 0: bunsuz eyni saniyədə verilən iki refresh token BAYT-BAYT eyni olurdu
   * (payload + iat + exp eynidir) → SHA-256 hash-ləri də eyni → RefreshToken.tokenHash
   * unique constraint pozulurdu və istifadəçi 409 "Bu token_hash artıq mövcuddur"
   * alırdı (məs. qeydiyyatdan dərhal sonra login).
   */
  jti?: string;
  iat?: number;
  exp?: number;
}
