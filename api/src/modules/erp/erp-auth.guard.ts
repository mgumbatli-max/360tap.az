import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import type { Request } from 'express';
import type Redis from 'ioredis';
import { PrismaService } from '../../prisma/prisma.service';
import { REDIS } from '../../redis/redis.module';

const WINDOW_MS = 5 * 60_000; // imza/timestamp etibarlılıq pəncərəsi

export interface ErpIntegrationCtx {
  id: string;
  store: { id: string; ownerId: string; isVerified: boolean };
}

export interface ErpRequest extends Request {
  rawBody?: Buffer;
  erpIntegration?: ErpIntegrationCtx;
}

function timingEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
  } catch {
    return false;
  }
}

/**
 * ERP sorğularını qoruyur. İmza KANONİK request üzərindədir:
 *   HMAC_sha256(secret, `${ts}\n${nonce}\n${METHOD}\n${path}\n${sha256(body)}`)
 * Başlıqlar: X-Erp-Tenant, Authorization: Bearer <api_key>, X-Signature,
 *            X-Erp-Timestamp (ms), X-Erp-Nonce.
 * Replay müdafiəsi: timestamp pəncərəsi + Redis-də birdəfəlik nonce.
 */
@Injectable()
export class ErpAuthGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(REDIS) private readonly redis: Redis,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<ErpRequest>();
    const tenant = req.headers['x-erp-tenant'];
    const auth = req.headers['authorization'];
    const signature = req.headers['x-signature'];
    const ts = req.headers['x-erp-timestamp'];
    const nonce = req.headers['x-erp-nonce'];

    if (
      typeof tenant !== 'string' ||
      typeof auth !== 'string' ||
      !auth.startsWith('Bearer ') ||
      typeof signature !== 'string' ||
      typeof ts !== 'string' ||
      typeof nonce !== 'string'
    ) {
      throw new UnauthorizedException('ERP autentifikasiya başlıqları yoxdur');
    }

    const tsNum = Number(ts);
    if (!Number.isFinite(tsNum) || Math.abs(Date.now() - tsNum) > WINDOW_MS) {
      throw new UnauthorizedException('Köhnəlmiş və ya yanlış timestamp');
    }

    const apiKey = auth.slice(7);
    const integration = await this.prisma.erpIntegration.findFirst({
      where: { erpTenantId: tenant, isActive: true },
      select: {
        id: true,
        apiKeyHash: true,
        webhookSecret: true,
        store: { select: { id: true, ownerId: true, isVerified: true } },
      },
    });
    if (!integration) throw new UnauthorizedException('ERP inteqrasiyası tapılmadı');

    const apiKeyHash = createHash('sha256').update(apiKey).digest('hex');
    if (!timingEqualHex(apiKeyHash, integration.apiKeyHash)) {
      throw new UnauthorizedException('Yanlış API açarı');
    }

    const raw = req.rawBody ?? Buffer.alloc(0);
    const bodyHash = createHash('sha256').update(raw).digest('hex');
    const method = req.method.toUpperCase();
    const path = (req.originalUrl || req.url).split('?')[0]; // externalId daxil
    const canonical = `${ts}\n${nonce}\n${method}\n${path}\n${bodyHash}`;
    const expected = createHmac('sha256', integration.webhookSecret).update(canonical).digest('hex');
    if (!timingEqualHex(expected, signature)) {
      throw new UnauthorizedException('İmza yanlışdır (X-Signature)');
    }

    // Replay: nonce yalnız bir dəfə (pəncərə müddətində Redis-də saxlanır)
    const fresh = await this.redis.set(
      `erp:nonce:${integration.id}:${nonce}`,
      '1',
      'PX',
      WINDOW_MS,
      'NX',
    );
    if (fresh !== 'OK') {
      throw new UnauthorizedException('Nonce təkrar istifadə olunub (replay)');
    }

    req.erpIntegration = { id: integration.id, store: integration.store };
    return true;
  }
}
