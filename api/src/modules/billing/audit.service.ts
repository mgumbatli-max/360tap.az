import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * ADMİN ƏMƏLİYYATLARININ İZİ.
 *
 * NİYƏ AYRICA SERVİS: paket qiyməti, abunə hədiyyəsi və əl ilə qeyd edilən ödəniş
 * pul dəyəri olan əməliyyatlardır. «Kim, nə vaxt, nəyi, hansı dəyərdən hansına
 * dəyişdi» sualına cavab verə bilməsək, mübahisəni həll etmək mümkün deyil.
 *
 * NİYƏ TRANSAKSİYA DAXİLİNDƏ: iz yazısı əməliyyatla eyni transaksiyada gedir —
 * əks halda «əməliyyat oldu, iz yoxdur» vəziyyəti yaranır və audit dəyərini itirir.
 * Ona görə `tx` parametri var; verilməyəndə adi klient işlədilir.
 */
@Injectable()
export class AuditService {
  private readonly logger = new Logger('Audit');

  constructor(private readonly prisma: PrismaService) {}

  async log(
    entry: {
      actorId?: string | null;
      action: string;
      entity: string;
      entityId?: string | null;
      before?: unknown;
      after?: unknown;
      ip?: string | null;
    },
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const client = tx ?? this.prisma;
    await client.auditLog.create({
      data: {
        actorId: entry.actorId ?? null,
        // Sxem məhdudiyyətləri (VarChar) — uzun dəyər 500 xətası verməsin.
        action: entry.action.slice(0, 60),
        entity: entry.entity.slice(0, 40),
        entityId: entry.entityId ?? null,
        before: this.snapshot(entry.before),
        after: this.snapshot(entry.after),
        ip: entry.ip ? entry.ip.slice(0, 45) : null,
      },
    });
  }

  /**
   * Prisma `Json` sahəsi Date və Decimal qəbul etmir; obyekti JSON dövrəsindən
   * keçirmək onları ISO sətrinə/rəqəmə çevirir və eyni zamanda dövri istinadları
   * üzə çıxarır (o halda iz itməsin deyə xəta udulur, sadəcə loglanır).
   */
  private snapshot(value: unknown): Prisma.InputJsonValue | undefined {
    if (value === undefined || value === null) return undefined;
    try {
      return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
    } catch (e) {
      this.logger.warn(`Audit snapshot serializasiya olunmadı: ${String(e).slice(0, 120)}`);
      return undefined;
    }
  }
}
