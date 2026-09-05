import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import type { UserRole, UserStatus } from '@prisma/client';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { AppConfig } from '../../../config/configuration';
import { PrismaService } from '../../../prisma/prisma.service';
import type { JwtPayload } from '../types/jwt-payload.type';

/**
 * NİYƏ BURADA DB OXUNUŞU VAR
 *
 * Əvvəl `validate()` yalnız `payload.type`-ı yoxlayırdı, yəni access token verildikdən
 * sonra HEÇ NƏ onu ləğv edə bilmirdi:
 *   · admin `PATCH /admin/users/:id` ilə hesabı `banned`/`suspended` edirdi, istifadəçi
 *     isə əlindəki token bitənə qədər (JWT_ACCESS_TTL = 15 dəq) işləməyə davam edirdi;
 *   · `POST /auth/logout` yalnız refresh tokeni revoke edirdi — access token yaşayırdı;
 *   · rol JWT claim-indən oxunurdu, halbuki `stores.service.ts` DB-də rolu `business`-ə
 *     dəyişir → guard köhnə rolu görürdü (rol drift-i).
 *
 * SEÇİLƏN VARİANT: hər sorğuda deyil, 30 saniyəlik yaddaş keşi arxasında DB oxunuşu.
 * `tokenVersion` sütunu variantı rədd edildi — sxem migrasiyası + JWT payload dəyişikliyi
 * tələb edir, deploy anında mövcud token-lərdə sahə olmur.
 *
 * FAIL-OPEN QƏSDƏNdir: DB müvəqqəti əlçatmaz olanda istisna atsaydıq, bütün autentifikasiya
 * olunmuş istifadəçilər eyni anda çıxarılardı. Belə halda köhnə JWT claim-ləri ilə davam
 * edilir (əvvəlki davranış) və xəbərdarlıq loglanır — ban ən çox keş TTL + nasazlıq müddəti
 * qədər gecikir.
 */
const CACHE_TTL_MS = 30_000;
const CACHE_MAX = 5_000;

interface CachedUser {
  role: UserRole;
  status: UserStatus;
  expiresAt: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  private readonly logger = new Logger(JwtStrategy.name);
  private readonly cache = new Map<string, CachedUser>();

  constructor(
    config: ConfigService<AppConfig, true>,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get('jwt', { infer: true }).secret,
      algorithms: ['HS256'],
    });
  }

  async validate(payload: JwtPayload): Promise<JwtPayload> {
    if (payload.type !== 'access') {
      throw new UnauthorizedException('Yanlış token tipi');
    }

    const current = await this.loadUser(payload.sub);
    if (!current) return payload; // DB oxunmadı → fail-open (yuxarıdakı izaha bax)

    // Login/refresh ilə eyni meyar (auth.service.ts:92) — `pending` bloklanmır ki,
    // təsdiqlənməmiş yeni hesablar qəfil çıxarılmasın.
    if (current.status === 'banned' || current.status === 'suspended') {
      throw new UnauthorizedException('Hesab bloklanıb');
    }
    // Rol DB-dən götürülür: RolesGuard artıq köhnə claim-ə deyil, cari vəziyyətə baxır
    return { ...payload, role: current.role };
  }

  private async loadUser(userId: string): Promise<CachedUser | null> {
    const now = Date.now();
    const hit = this.cache.get(userId);
    if (hit && hit.expiresAt > now) return hit;

    let row: { role: UserRole; status: UserStatus } | null;
    try {
      row = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { role: true, status: true },
      });
    } catch (e) {
      this.logger.warn(
        `İstifadəçi statusu oxunmadı (fail-open): ${e instanceof Error ? e.message : String(e)}`,
      );
      return null;
    }
    if (!row) {
      // Silinmiş istifadəçinin tokeni ilə davam etmək olmaz
      this.cache.delete(userId);
      throw new UnauthorizedException('İstifadəçi tapılmadı');
    }

    // Sadə həcm qapağı: keş sonsuz böyüməsin (LRU deyil — FIFO təmizləmə kifayətdir)
    if (this.cache.size >= CACHE_MAX) this.cache.clear();
    const entry: CachedUser = { ...row, expiresAt: now + CACHE_TTL_MS };
    this.cache.set(userId, entry);
    return entry;
  }
}
