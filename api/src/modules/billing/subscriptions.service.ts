import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { ListMeta } from '../listings/listings.service';
import { AuditService } from './audit.service';
import {
  toAdminSubscriptionResponse,
  toMeSubscriptionResponse,
  type AdminSubscriptionResponse,
  type MeSubscriptionResponse,
} from './dto/billing-response.dto';
import type { CreateSubscriptionDto } from './dto/create-subscription.dto';
import type { QuerySubscriptionsDto } from './dto/query-billing.dto';

const DAY_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class SubscriptionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /**
   * ADMİN ƏL İLƏ ABUNƏ VERİR (ödənişsiz).
   *
   * NİYƏ PAKET ŞƏRTLƏRİ KÖÇÜRÜLÜR: `balanceLeft`, `quotaLeft`, `discountPercent`
   * paketdən JOIN ilə oxunmur, abunə sətrinə YAZILIR. Səbəb — paketin qiyməti və
   * şərtləri sabah dəyişəcək; artıq verilmiş abunə isə verildiyi andakı şərtlərlə
   * qalmalıdır. Əks halda admin paketi redaktə edəndə keçmiş müştərilərin
   * balansı da dəyişərdi.
   *
   * NİYƏ MÖVCUD ABUNƏ MANE OLMUR: eyni istifadəçiyə ardıcıl dövr üçün ikinci
   * abunə vermək normal haldır (uzatma). Oxu tərəfi qeyri-müəyyən qalmasın deyə
   * `findActive()` ən gec bitən aktiv abunəni qaytarır.
   */
  async grant(
    dto: CreateSubscriptionDto,
    actor: { id: string; ip: string | null },
  ): Promise<AdminSubscriptionResponse> {
    const [user, pkg] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: dto.userId },
        select: { id: true, fullName: true, email: true, phone: true },
      }),
      this.prisma.package.findUnique({ where: { id: dto.packageId } }),
    ]);
    if (!user) throw new NotFoundException('İstifadəçi tapılmadı');
    if (!pkg) throw new NotFoundException('Paket tapılmadı');

    const startsAt = new Date();
    const endsAt = new Date(startsAt.getTime() + pkg.durationDays * DAY_MS);

    return this.prisma.$transaction(async (tx) => {
      const sub = await tx.subscription.create({
        data: {
          userId: user.id,
          packageId: pkg.id,
          status: 'active',
          startsAt,
          endsAt,
          balanceLeft: pkg.serviceBalance,
          quotaLeft: pkg.listingQuota,
          discountPercent: pkg.discountPercent,
          grantedBy: actor.id,
          note: dto.note ?? null,
        },
        include: { package: true },
      });
      const response = toAdminSubscriptionResponse(sub, user, startsAt);
      await this.audit.log(
        {
          actorId: actor.id,
          action: 'subscription.grant',
          entity: 'Subscription',
          entityId: sub.id,
          after: response,
          ip: actor.ip,
        },
        tx,
      );
      return response;
    });
  }

  /** Admin siyahısı — istifadəçi və status üzrə filtr, səhifələmə ilə. */
  async listAdmin(
    q: QuerySubscriptionsDto,
  ): Promise<{ data: AdminSubscriptionResponse[]; meta: ListMeta }> {
    const page = q.page ?? 1;
    const limit = Math.min(q.limit ?? 20, 50);

    const where: Prisma.SubscriptionWhereInput = {};
    if (q.userId) where.userId = q.userId;
    if (q.status) where.status = q.status;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.subscription.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { package: true },
      }),
      this.prisma.subscription.count({ where }),
    ]);

    // `Subscription` modelində `User` əlaqəsi YOXDUR (yalnız `userId` sahəsi var),
    // ona görə istifadəçilər tək əlavə sorğu ilə çəkilir — sətir başına sorğu (N+1) yox.
    const userIds = [...new Set(items.map((s) => s.userId))];
    const users = userIds.length
      ? await this.prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, fullName: true, email: true, phone: true },
        })
      : [];
    const byId = new Map(users.map((u) => [u.id, u]));

    const now = new Date();
    return {
      data: items.map((s) => toAdminSubscriptionResponse(s, byId.get(s.userId) ?? null, now)),
      meta: { page, limit, total, hasMore: page * limit < total },
    };
  }

  /**
   * İstifadəçinin cari abunəsi (yoxdursa `null`).
   * Saxlanan `status` sahəsinə tək başına etibar edilmir: dövr bitəndə sətir
   * avtomatik yenilənmir, ona görə `endsAt` da yoxlanılır.
   */
  async findActive(userId: string): Promise<MeSubscriptionResponse | null> {
    const sub = await this.prisma.subscription.findFirst({
      where: { userId, status: 'active', endsAt: { gt: new Date() } },
      orderBy: { endsAt: 'desc' },
      include: { package: true },
    });
    return sub ? toMeSubscriptionResponse(sub) : null;
  }
}
