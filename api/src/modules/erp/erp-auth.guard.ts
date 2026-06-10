import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import type { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';

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
 * ERP sorğularını qoruyur: X-Erp-Tenant + Authorization Bearer <api_key> + X-Signature (HMAC).
 * Uğurlu olduqda req.erpIntegration təyin olunur.
 */
@Injectable()
export class ErpAuthGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<ErpRequest>();
    const tenant = req.headers['x-erp-tenant'];
    const auth = req.headers['authorization'];
    const signature = req.headers['x-signature'];

    if (typeof tenant !== 'string' || typeof auth !== 'string' || !auth.startsWith('Bearer ')) {
      throw new UnauthorizedException('ERP autentifikasiya başlıqları yoxdur');
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
    const expected = createHmac('sha256', integration.webhookSecret).update(raw).digest('hex');
    if (typeof signature !== 'string' || !timingEqualHex(expected, signature)) {
      throw new UnauthorizedException('İmza yanlışdır (X-Signature)');
    }

    req.erpIntegration = { id: integration.id, store: integration.store };
    return true;
  }
}
