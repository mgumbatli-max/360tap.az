import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Prisma, type User, type UserRole } from '@prisma/client';
import * as argon2 from 'argon2';
import { createHash, randomBytes } from 'node:crypto';
import type { AppConfig } from '../../config/configuration';
import { PrismaService } from '../../prisma/prisma.service';
import { normalizeEmail, normalizePhone } from '../messaging/messaging.types';
import { VerificationService } from '../verification/verification.service';
import type { AuthResponse, AuthTokens, PublicUser } from './dto/auth-response.dto';
import type { LoginDto } from './dto/login.dto';
import type { RegisterDto } from './dto/register.dto';
import type { VerifyOtpDto } from './dto/verify-otp.dto';
import type { JwtPayload } from './types/jwt-payload.type';

/** Telefonla girişin cavabı — mövcud `AuthResponse`-a «hesab indi yarandı?» əlavə olunur. */
export interface OtpAuthResponse extends AuthResponse {
  isNew: boolean;
}

export interface OtpChallenge {
  expiresInSec: number;
  resendAfterSec: number;
  devCode?: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService<AppConfig, true>,
    private readonly verification: VerificationService,
  ) {}

  // -----------------------------------------------------------
  // Public API
  // -----------------------------------------------------------

  async register(dto: RegisterDto, ctx: ClientCtx): Promise<AuthResponse> {
    if (!dto.email && !dto.phone) {
      throw new ConflictException('Email və ya telefon tələb olunur');
    }

    const passwordHash = await this.hashPassword(dto.password);

    let user: User;
    try {
      user = await this.prisma.user.create({
        data: {
          fullName: dto.fullName,
          email: dto.email ? normalizeEmail(dto.email) : null,
          phone: dto.phone ?? null,
          passwordHash,
          districtId: dto.districtId ?? null,
        },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('Bu email və ya telefon artıq qeydiyyatdan keçib');
      }
      throw e;
    }

    // Təsdiq mektubu FON İŞİDİR: mektub getməsə də qeydiyyat uğurludur və cavab gecikmir.
    if (user.email) {
      this.sendEmailVerificationInBackground(user.id, user.email);
    }

    const tokens = await this.issueTokens(user, ctx);
    return { user: this.toPublic(user), tokens };
  }

  async login(dto: LoginDto, ctx: ClientCtx): Promise<AuthResponse> {
    const isEmail = dto.identifier.includes('@');
    const where: Prisma.UserWhereInput = isEmail
      ? { email: dto.identifier.toLowerCase() }
      : { phone: dto.identifier };

    const user = await this.prisma.user.findFirst({ where });
    if (!user) throw new UnauthorizedException('Yanlış məlumatlar');
    if (user.status === 'banned' || user.status === 'suspended') {
      throw new UnauthorizedException('Hesab bloklanıb');
    }

    const ok = await argon2.verify(user.passwordHash, dto.password);
    if (!ok) throw new UnauthorizedException('Yanlış məlumatlar');

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const tokens = await this.issueTokens(user, ctx);
    return { user: this.toPublic(user), tokens };
  }

  async refresh(refreshToken: string, ctx: ClientCtx): Promise<AuthTokens> {
    let payload: JwtPayload;
    try {
      payload = this.jwt.verify<JwtPayload>(refreshToken);
    } catch {
      throw new UnauthorizedException('Yanlış və ya vaxtı keçmiş refresh token');
    }
    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Yanlış token tipi');
    }

    const tokenHash = this.hashToken(refreshToken);

    // Atomik rotation: revoke + status yoxlaması + yeni token bir tranzaksiyada.
    return this.prisma.$transaction(async (tx) => {
      // Yalnız hələ revoke olunmamış və vaxtı keçməmiş tokeni revoke et.
      // count !== 1 → tapılmadı / artıq istifadə olunub (reuse detection) → rədd.
      const revoked = await tx.refreshToken.updateMany({
        where: { tokenHash, revokedAt: null, expiresAt: { gt: new Date() } },
        data: { revokedAt: new Date() },
      });
      if (revoked.count !== 1) {
        throw new UnauthorizedException('Refresh token etibarsızdır');
      }

      const user = await tx.user.findUnique({ where: { id: payload.sub } });
      if (!user) throw new UnauthorizedException('İstifadəçi tapılmadı');
      if (user.status === 'banned' || user.status === 'suspended') {
        throw new UnauthorizedException('Hesab bloklanıb');
      }

      return this.issueTokens(user, ctx, tx);
    });
  }

  async logout(refreshToken: string): Promise<void> {
    const tokenHash = this.hashToken(refreshToken);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async getMe(userId: string): Promise<PublicUser> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('İstifadəçi tapılmadı');
    return this.toPublic(user);
  }

  // -----------------------------------------------------------
  // Telefonla OTP girişi
  // -----------------------------------------------------------

  async sendOtp(rawPhone: string): Promise<OtpChallenge> {
    const phone = this.requirePhone(rawPhone);

    // Hesabın olub-olmaması cavabı DƏYİŞMİR — əks halda nömrə sayımı mümkün olardı.
    const user = await this.prisma.user.findUnique({ where: { phone } });
    const result = await this.verification.issue('sms', 'login', phone, user?.id ?? null);

    return {
      expiresInSec: result.expiresInSec,
      resendAfterSec: result.resendAfterSec,
      ...(result.devCode ? { devCode: result.devCode } : {}),
    };
  }

  async verifyOtp(dto: VerifyOtpDto, ctx: ClientCtx): Promise<OtpAuthResponse> {
    const phone = this.requirePhone(dto.phone);

    const check = await this.verification.verify('login', phone, dto.code);
    if (!check.ok) {
      throw new UnauthorizedException('Kod yanlışdır və ya vaxtı keçib');
    }

    const existing = await this.prisma.user.findUnique({ where: { phone } });
    if (existing) {
      if (existing.status === 'banned' || existing.status === 'suspended') {
        throw new UnauthorizedException('Hesab bloklanıb');
      }
      const user = await this.prisma.user.update({
        where: { id: existing.id },
        data: { isPhoneVerified: true, lastLoginAt: new Date() },
      });
      const tokens = await this.issueTokens(user, ctx);
      return { user: this.toPublic(user), tokens, isNew: false };
    }

    // Telefonla yaradılan hesabda PAROL YOXDUR, amma `passwordHash` sahəsi məcburidir.
    // Ona görə 32 baytlıq təsadüfi dəyər hash-lənir: heç kim onu tapa bilmədiyi üçün
    // parol ilə giriş faktiki olaraq bağlıdır (istifadəçi «parolu unutdum» ilə təyin edir).
    const passwordHash = await this.hashPassword(randomBytes(32).toString('base64url'));
    // Ad verilməyibsə boş qalmır — `fullName` məcburidir, nömrənin sonu ilə fərqlənən ad qoyulur.
    const fullName = dto.fullName?.trim() || `İstifadəçi ${phone.slice(-4)}`;

    let created: User;
    try {
      created = await this.prisma.user.create({
        data: { fullName, phone, passwordHash, isPhoneVerified: true, lastLoginAt: new Date() },
      });
    } catch (e) {
      // Yarış: eyni kodla iki paralel sorğu. Nömrə unikaldır — ikinci sorğu buraya düşür.
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('Bu nömrə artıq qeydiyyatdan keçib');
      }
      throw e;
    }

    const tokens = await this.issueTokens(created, ctx);
    return { user: this.toPublic(created), tokens, isNew: true };
  }

  // -----------------------------------------------------------
  // E-poçt təsdiqi
  // -----------------------------------------------------------

  async sendEmailVerification(userId: string): Promise<{ sent: boolean }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('İstifadəçi tapılmadı');
    if (!user.email) throw new BadRequestException('Hesabda e-poçt ünvanı yoxdur');
    if (user.isEmailVerified) return { sent: false };

    const result = await this.verification.issue(
      'email',
      'verify_contact',
      normalizeEmail(user.email),
      user.id,
    );
    return { sent: result.delivered };
  }

  async verifyEmail(token: string): Promise<{ verified: true }> {
    const check = await this.verification.verifyToken('verify_contact', token);
    if (!check.ok) {
      throw new BadRequestException('Token etibarsızdır və ya vaxtı keçib');
    }

    // Token `userId` daşımaya bilər (məs. sətir hədəfə görə yaradılıb) — hər iki yol dəstəklənir.
    const where: Prisma.UserWhereInput = check.userId
      ? { id: check.userId }
      : { email: check.target };
    const updated = await this.prisma.user.updateMany({ where, data: { isEmailVerified: true } });
    if (updated.count === 0) {
      throw new BadRequestException('Token etibarsızdır və ya vaxtı keçib');
    }
    return { verified: true };
  }

  // -----------------------------------------------------------
  // Parolun bərpası
  // -----------------------------------------------------------

  /**
   * Cavab HƏMİŞƏ eynidir — «belə e-poçt yoxdur» demək hesab sayımına yol açardı.
   * Hesab tapılmayanda sadəcə heç nə göndərilmir.
   */
  async forgotPassword(rawEmail: string): Promise<{ sent: true }> {
    const email = normalizeEmail(rawEmail);
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (user) {
      try {
        await this.verification.issue('email', 'reset_password', email, user.id);
      } catch (e) {
        // Xəta da cavabı dəyişməməlidir — yoxsa sayım xətanın özündən sızar.
        this.logger.warn(
          `Parol bərpa mektubu buraxıldı: ${e instanceof Error ? e.message : String(e)}`,
        );
      }
    }

    return { sent: true };
  }

  async resetPassword(token: string, password: string): Promise<{ reset: true }> {
    const check = await this.verification.verifyToken('reset_password', token);
    if (!check.ok || !check.userId) {
      throw new BadRequestException('Token etibarsızdır və ya vaxtı keçib');
    }

    const passwordHash = await this.hashPassword(password);

    // Parol dəyişdikdə BÜTÜN köhnə sessiyalar ölməlidir: oğurlanmış refresh token
    // sıfırlamadan sonra da işləsəydi, bərpanın mənası qalmazdı.
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: check.userId }, data: { passwordHash } }),
      this.prisma.refreshToken.updateMany({
        where: { userId: check.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    return { reset: true };
  }

  // -----------------------------------------------------------
  // Internal helpers
  // -----------------------------------------------------------

  /** Nömrə AZ formatına uyğun deyilsə 422 — kod göndərməzdən əvvəl kəsilir. */
  private requirePhone(raw: string): string {
    const phone = normalizePhone(raw);
    if (!phone) {
      throw new UnprocessableEntityException('Telefon nömrəsi yanlışdır (+994 XX XXX XX XX)');
    }
    return phone;
  }

  private hashPassword(password: string): Promise<string> {
    return argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 19_456,
      timeCost: 2,
      parallelism: 1,
    });
  }

  /** Qeydiyyat cavabını gözlətməmək üçün — nəticə yalnız loglanır. */
  private sendEmailVerificationInBackground(userId: string, email: string): void {
    void this.verification
      .issue('email', 'verify_contact', normalizeEmail(email), userId)
      .catch((e: unknown) => {
        this.logger.warn(
          `Qeydiyyat təsdiq mektubu göndərilmədi: ${e instanceof Error ? e.message : String(e)}`,
        );
      });
  }

  private async issueTokens(
    user: User,
    ctx: ClientCtx,
    tx?: Prisma.TransactionClient,
  ): Promise<AuthTokens> {
    const db = tx ?? this.prisma;
    const { accessTtl, refreshTtl } = this.config.get('jwt', { infer: true });

    const accessPayload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role as UserRole,
      type: 'access',
    };
    const refreshPayload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role as UserRole,
      type: 'refresh',
      // Unikal token id — eyni saniyədə verilən token-lərin eyni olmasının qarşısını alır.
      jti: randomBytes(16).toString('hex'),
    };

    const accessToken = this.jwt.sign(accessPayload, { expiresIn: accessTtl });
    const refreshTokenRaw = this.jwt.sign(refreshPayload, { expiresIn: refreshTtl });

    // Refresh-i hash şəklində saxla (DB-ə düz yaz olmasın)
    await db.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: this.hashToken(refreshTokenRaw),
        expiresAt: new Date(Date.now() + refreshTtl * 1000),
        userAgent: ctx.userAgent ?? null,
        ipAddress: ctx.ip ?? null,
      },
    });

    return {
      accessToken,
      refreshToken: refreshTokenRaw,
      accessExpiresIn: accessTtl,
    };
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private toPublic(user: User): PublicUser {
    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      fullName: user.fullName,
      role: user.role,
      status: user.status,
      avatarUrl: user.avatarUrl,
      rating: Number(user.rating),
      reviewsCount: user.reviewsCount,
      isPhoneVerified: user.isPhoneVerified,
      isEmailVerified: user.isEmailVerified,
      createdAt: user.createdAt,
    };
  }

  /** Test üçün — quru random token yaratma. */
  generateRandomToken(): string {
    return randomBytes(32).toString('hex');
  }
}

export interface ClientCtx {
  ip?: string;
  userAgent?: string;
}
