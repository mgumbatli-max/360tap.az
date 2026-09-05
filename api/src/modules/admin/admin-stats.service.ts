import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';

/**
 * XÜLASƏ EKRANI — YALNIZ REAL RƏQƏMLƏR.
 *
 * Burada «gözəl görünsün deyə» qoyulmuş bir dənə də olsun uydurma dəyər yoxdur:
 * hər rəqəm birbaşa DB sayğacından gəlir. Hesablana bilməyən göstərici (məs.
 * gəlir — hələ heç bir ödəniş axını işləmir) ÜMUMİYYƏTLƏ qaytarılmır ki, panel
 * onu «0 AZN gəlir» kimi doğru olmayan formada göstərməsin.
 */

const DAYS = 7;

interface DailyRow {
  day: Date;
  count: number;
}

/** UTC gün açarı — DB-də `created_at` UTC saxlanır, `date_trunc` da UTC verir. */
function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

@Injectable()
export class AdminStatsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: SettingsService,
  ) {}

  async summary() {
    // Son 7 günün başlanğıcı (bugün daxil) — UTC gecə yarısına yuvarlaqlaşdırılır,
    // yoxsa «son 7 gün» hər sorğuda sürüşən pəncərə olardı və qrafik titrəyərdi.
    const since = new Date();
    since.setUTCHours(0, 0, 0, 0);
    since.setUTCDate(since.getUTCDate() - (DAYS - 1));

    const [
      listingsTotal,
      listingsByStatus,
      usersTotal,
      usersByRole,
      usersByStatus,
      storesTotal,
      storesByStatus,
      storesVerified,
      categoriesTotal,
      categoriesActive,
      listingsWithStore,
      listingsLast7,
      usersLast7,
      storesLast7,
      dailyListings,
      dailyUsers,
      monetizationEnabled,
    ] = await Promise.all([
      this.prisma.listing.count(),
      this.prisma.listing.groupBy({ by: ['status'], _count: { _all: true } }),
      this.prisma.user.count(),
      this.prisma.user.groupBy({ by: ['role'], _count: { _all: true } }),
      this.prisma.user.groupBy({ by: ['status'], _count: { _all: true } }),
      this.prisma.store.count(),
      this.prisma.store.groupBy({ by: ['status'], _count: { _all: true } }),
      this.prisma.store.count({ where: { isVerified: true } }),
      this.prisma.category.count(),
      this.prisma.category.count({ where: { isActive: true } }),
      // «Qırıq halqa 1»-in ölçüsü: mağazaya bağlanmış elan sayı. 0 olması
      // mağaza səhifələrinin boş qalması deməkdir — panel bunu görməlidir.
      this.prisma.listing.count({ where: { storeId: { not: null } } }),
      this.prisma.listing.count({ where: { createdAt: { gte: since } } }),
      this.prisma.user.count({ where: { createdAt: { gte: since } } }),
      this.prisma.store.count({ where: { createdAt: { gte: since } } }),
      this.dailySeries('listings', since),
      this.dailySeries('users', since),
      this.settings.isEnabled('monetization.enabled'),
    ]);

    const listingMap = new Map(dailyListings.map((r) => [dayKey(r.day), r.count]));
    const userMap = new Map(dailyUsers.map((r) => [dayKey(r.day), r.count]));

    // Boş günlər sıfırla doldurulur — qrafikdə gün itməsin (əks halda 3 sütun
    // 7 günlük oxa yayılıb yanlış trend təəssüratı yaradır).
    const daily = Array.from({ length: DAYS }, (_, i) => {
      const d = new Date(since);
      d.setUTCDate(since.getUTCDate() + i);
      const key = dayKey(d);
      return { date: key, listings: listingMap.get(key) ?? 0, users: userMap.get(key) ?? 0 };
    });

    return {
      listings: {
        total: listingsTotal,
        byStatus: toCountMap(listingsByStatus, 'status'),
        withStore: listingsWithStore,
        last7d: listingsLast7,
      },
      users: {
        total: usersTotal,
        byRole: toCountMap(usersByRole, 'role'),
        byStatus: toCountMap(usersByStatus, 'status'),
        last7d: usersLast7,
      },
      stores: {
        total: storesTotal,
        byStatus: toCountMap(storesByStatus, 'status'),
        verified: storesVerified,
        last7d: storesLast7,
      },
      categories: { total: categoriesTotal, active: categoriesActive },
      daily,
      /** Panel «limitlər hesablanır, amma tətbiq olunmur» xəbərdarlığını buna görə göstərir. */
      monetizationEnabled,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Günlük seriya. NİYƏ xam SQL: Prisma `groupBy` tarixi günə yuvarlaqlaşdıra
   * bilmir; bütün sətirləri çəkib JS-də qruplaşdırmaq isə cədvəl böyüdükcə
   * yaddaşı yeyir. Cədvəl adı sabit siyahıdan gəlir — SQL injection yolu yoxdur.
   */
  private async dailySeries(table: 'listings' | 'users', since: Date): Promise<DailyRow[]> {
    const source = table === 'listings' ? Prisma.sql`listings` : Prisma.sql`users`;
    return this.prisma.$queryRaw<DailyRow[]>`
      SELECT date_trunc('day', created_at) AS day, COUNT(*)::int AS count
      FROM ${source}
      WHERE created_at >= ${since}
      GROUP BY 1
      ORDER BY 1
    `;
  }
}

/** groupBy nəticəsini `{ dəyər: say }` xəritəsinə çevirir. */
function toCountMap<K extends string>(
  rows: ({ _count: { _all: number } } & Record<K, string>)[],
  key: K,
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const row of rows) out[row[key]] = row._count._all;
  return out;
}
