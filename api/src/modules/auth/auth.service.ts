import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Prisma, type User, type UserRole } from '@prisma/client';
import * as argon2 from 'argon2';
import { createHash, randomBytes } from 'node:crypto';
import type { AppConfig } from '../../config/configuration';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuthResponse, AuthTokens, PublicUser } from './dto/auth-response.dto';
import type { LoginDto } from './dto/login.dto';
import type { RegisterDto } from './dto/register.dto';
import type { JwtPayload } from './types/jwt-payload.type';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService<AppConfig, true>,
  ) {}

  // -----------------------------------------------------------
  // Public API
  // -----------------------------------------------------------

  async register(dto: RegisterDto, ctx: ClientCtx): Promise<AuthResponse> {
    if (!dto.email && !dto.phone) {
      throw new ConflictException('Email və ya telefon tələb olunur');
    }

    const passwordHash = await argon2.hash(dto.password, {
      type: argon2.argon2id,
      memoryCost: 19_456,
      timeCost: 2,
      parallelism: 1,
    });

    let user: User;
    try {
      user = await this.prisma.user.create({
        data: {
          fullName: dto.fullName,
          email: dto.email?.toLowerCase() ?? null,
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
    const stored = await this.prisma.refreshToken.findUnique({ where: { tokenHash } });
    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token etibarsızdır');
    }

    // Rotation: köhnəni revoke et
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) throw new UnauthorizedException('İstifadəçi tapılmadı');

    return this.issueTokens(user, ctx);
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
  // Internal helpers
  // -----------------------------------------------------------

  private async issueTokens(user: User, ctx: ClientCtx): Promise<AuthTokens> {
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
    };

    const accessToken = this.jwt.sign(accessPayload, { expiresIn: accessTtl });
    const refreshTokenRaw = this.jwt.sign(refreshPayload, { expiresIn: refreshTtl });

    // Refresh-i hash şəklində saxla (DB-ə düz yaz olmasın)
    await this.prisma.refreshToken.create({
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
