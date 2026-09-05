import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * AUDİT JURNALI — «kim, nəyi, nə vaxt dəyişdi» sualının yeganə cavabı.
 *
 * NİYƏ AYRICA SERVİS: admin əməliyyatları geri dönüşü olmayan nəticələr verir
 * (mağaza dayandırılır, istifadəçiyə admin rolu verilir). Bunlar loq faylında
 * yox, sorğulana bilən cədvəldə qalmalıdır — mübahisə və insident təhqiqatı üçün.
 *
 * NİYƏ `tx` parametri: yazı əməliyyatının özü ilə audit qeydi EYNİ tranzaksiyada
 * getməlidir. Əks halda ya dəyişiklik izsiz qalır (audit uğursuz olur), ya da
 * baş verməmiş dəyişiklik jurnalda görünür (əməliyyat geri qaytarılır).
 */
export interface AuditEntry {
  actorId: string;
  /** Qısa maşın oxunaqlı əməliyyat adı: `store.update`, `user.role_change`… (≤60) */
  action: string;
  /** Obyekt tipi: `store`, `user`, `setting`, `category_limit` (≤40) */
  entity: string;
  entityId?: string | null;
  before?: Prisma.InputJsonValue;
  after?: Prisma.InputJsonValue;
  ip?: string | null;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger('Audit');

  constructor(private readonly prisma: PrismaService) {}

  async record(entry: AuditEntry, tx?: Prisma.TransactionClient): Promise<void> {
    const db = tx ?? this.prisma;
    await db.auditLog.create({
      data: {
        actorId: entry.actorId,
        // Sxemdəki VarChar limitləri: uzun dəyər 500 xətası verməməlidir.
        action: entry.action.slice(0, 60),
        entity: entry.entity.slice(0, 40),
        entityId: entry.entityId ?? null,
        before: entry.before ?? Prisma.JsonNull,
        after: entry.after ?? Prisma.JsonNull,
        ip: entry.ip ? entry.ip.slice(0, 45) : null,
      },
    });
    this.logger.log(`${entry.action} · ${entry.entity}:${entry.entityId ?? '-'} · actor=${entry.actorId}`);
  }
}
