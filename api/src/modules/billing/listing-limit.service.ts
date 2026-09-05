import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';

/** Limit pəncərəsi — «son 30 gün», təqvim ayı deyil (sxem şərhi ilə eyni). */
export const LIMIT_WINDOW_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

export type ListingLimitReason =
  /** Kateqoriya üçün limit ümumiyyətlə konfiqurasiya edilməyib. */
  | 'no_category_limit'
  /** Pulsuz limit hələ dolmayıb. */
  | 'within_limit'
  /** Pulsuz limit dolub, amma aktiv abunənin elan kvotası var. */
  | 'subscription_quota'
  /** Pulsuz limit dolub və kvota da yoxdur. */
  | 'limit_reached';

export interface ListingLimitCheck {
  categoryId: string;
  /** Son 30 gündə həmin kateqoriyada yaradılmış elan sayı. */
  used: number;
  /** Pulsuz limit; `null` — bu kateqoriyada limit yoxdur. */
  limit: number | null;
  /** Qalıq; `limit` null olduqda `null`. */
  remaining: number | null;
  /** Elan yaratmaq DAYANDIRILMALIDIRMI. Bayraqlar bağlıdırsa həmişə `false`. */
  blocked: boolean;
  reason: ListingLimitReason;
  /** Limitin faktiki tətbiq olunub-olunmadığı (bayraqlar + kateqoriya açarı). */
  enforced: boolean;
  /** Aktiv abunələrdən gələn ümumi elan kvotası. */
  subscriptionQuotaLeft: number;
  windowDays: number;
}

export interface ListingLimitOverview {
  /** Ən azı bir kateqoriyada limit faktiki işləyirmi. */
  enforced: boolean;
  subscriptionQuotaLeft: number;
  windowDays: number;
  categories: (ListingLimitCheck & { categoryName: string | null; categorySlug: string | null })[];
}

/**
 * PULSUZ ELAN LİMİTİ MÜHƏRRİKİ.
 *
 * NİYƏ AYRICA SERVİS: bu, platformanın əsl monetizasiya leveridir (mağaza
 * səhifəsi deyil) — tap.az Maşınlar 1/ay, turbo.az diler üçün 0 pulsuz elan.
 * Hesablama məntiqi bir yerdə olmalıdır ki, elan yaratma axını, admin paneli və
 * istifadəçi ekranı EYNİ rəqəmi göstərsin.
 *
 * NİYƏ BAYRAQLAR BAĞLI OLANDA DA HESABLAYIRIQ: platformada hələ trafik yoxdur.
 * Limit dərhal tətbiq etsək tədarükü öldürərik; ümumiyyətlə hesablamasaq isə
 * astananı nə vaxt keçdiyimizi bilməyəcəyik. Ona görə rəqəm HƏMİŞƏ hesablanır,
 * `blocked` isə yalnız `monetization.enabled` + `listing_limits.enabled` +
 * kateqoriyanın öz `enabled` açarı — hər üçü açıq olduqda `true` ola bilər.
 */
@Injectable()
export class ListingLimitService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: SettingsService,
  ) {}

  /** Tək kateqoriya üçün vəziyyət. Elan yaratma axını bunu çağıracaq. */
  async check(userId: string, categoryId: string): Promise<ListingLimitCheck> {
    const windowStart = this.windowStart();

    const [globallyEnabled, limitRow, isStoreAccount, used, subscriptionQuotaLeft] =
      await Promise.all([
        this.settings.isMonetizedFeatureEnabled('listing_limits.enabled'),
        this.prisma.categoryLimit.findUnique({ where: { categoryId } }),
        this.hasStore(userId),
        this.countUsed(userId, categoryId, windowStart),
        this.subscriptionQuota(userId),
      ]);

    // Mağaza hesabı üçün ayrıca limit; `null` = fərdi satıcı limiti ilə eyni.
    const limit = limitRow
      ? isStoreAccount
        ? (limitRow.storeFreePerMonth ?? limitRow.freePerMonth)
        : limitRow.freePerMonth
      : null;

    return this.build({
      categoryId,
      used,
      limit,
      subscriptionQuotaLeft,
      // Kateqoriyanın öz açarı bağlıdırsa limit görünür, amma tətbiq olunmur.
      enforced: globallyEnabled && limitRow?.enabled === true,
    });
  }

  /**
   * İstifadəçiyə göstərmək üçün ümumi mənzərə.
   * `categoryId` verilirsə yalnız o kateqoriya (limit konfiqurasiya edilməsə belə —
   * istifadəçi «limit yoxdur» cavabını da görməlidir).
   */
  async overview(userId: string, categoryId?: string): Promise<ListingLimitOverview> {
    const subscriptionQuotaLeft = await this.subscriptionQuota(userId);

    if (categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: categoryId },
        select: { nameAz: true, slug: true },
      });
      if (!category) throw new NotFoundException('Kateqoriya tapılmadı');

      const check = await this.check(userId, categoryId);
      return {
        enforced: check.enforced,
        subscriptionQuotaLeft,
        windowDays: LIMIT_WINDOW_DAYS,
        categories: [{ ...check, categoryName: category.nameAz, categorySlug: category.slug }],
      };
    }

    const rows = await this.prisma.categoryLimit.findMany({
      include: { category: { select: { nameAz: true, slug: true } } },
    });
    if (rows.length === 0) {
      return { enforced: false, subscriptionQuotaLeft, windowDays: LIMIT_WINDOW_DAYS, categories: [] };
    }

    const [globallyEnabled, isStoreAccount, grouped] = await Promise.all([
      this.settings.isMonetizedFeatureEnabled('listing_limits.enabled'),
      this.hasStore(userId),
      // Kateqoriya başına ayrı `count` əvəzinə tək `groupBy` — sorğu sayı sabit qalır.
      this.prisma.listing.groupBy({
        by: ['categoryId'],
        where: {
          ownerId: userId,
          categoryId: { in: rows.map((r) => r.categoryId) },
          createdAt: { gte: this.windowStart() },
        },
        _count: { _all: true },
      }),
    ]);
    const usedByCategory = new Map(grouped.map((g) => [g.categoryId, g._count._all]));

    const categories = rows.map((row) => {
      const limit = isStoreAccount
        ? (row.storeFreePerMonth ?? row.freePerMonth)
        : row.freePerMonth;
      const check = this.build({
        categoryId: row.categoryId,
        used: usedByCategory.get(row.categoryId) ?? 0,
        limit,
        subscriptionQuotaLeft,
        enforced: globallyEnabled && row.enabled,
      });
      return {
        ...check,
        categoryName: row.category.nameAz,
        categorySlug: row.category.slug,
      };
    });

    return {
      enforced: categories.some((c) => c.enforced),
      subscriptionQuotaLeft,
      windowDays: LIMIT_WINDOW_DAYS,
      categories,
    };
  }

  private build(input: {
    categoryId: string;
    used: number;
    limit: number | null;
    subscriptionQuotaLeft: number;
    enforced: boolean;
  }): ListingLimitCheck {
    const { categoryId, used, limit, subscriptionQuotaLeft, enforced } = input;
    const remaining = limit === null ? null : Math.max(0, limit - used);

    let reason: ListingLimitReason;
    if (limit === null) reason = 'no_category_limit';
    else if (remaining !== null && remaining > 0) reason = 'within_limit';
    else if (subscriptionQuotaLeft > 0) reason = 'subscription_quota';
    else reason = 'limit_reached';

    return {
      categoryId,
      used,
      limit,
      remaining,
      blocked: enforced && reason === 'limit_reached',
      reason,
      enforced,
      subscriptionQuotaLeft,
      windowDays: LIMIT_WINDOW_DAYS,
    };
  }

  private windowStart(): Date {
    return new Date(Date.now() - LIMIT_WINDOW_DAYS * DAY_MS);
  }

  /**
   * SAYĞAC — STATUS FİLTRİ QƏSDƏN YOXDUR.
   *
   * Rəqiblərdə (tap.az, turbo.az) silinmiş və rədd edilmiş elan da aylıq limitə
   * daxildir. Səbəb açıqdır: əks halda «elanı sil → yenidən yerləşdir» limitin
   * ətrafından dolanmağın pulsuz yoludur və limit heç nə ifadə etmir.
   * Ona görə burada `status` üzrə filtr YOXDUR — pəncərədə YARADILMIŞ hər elan
   * sayılır (arxivlənmiş, rədd edilmiş, vaxtı keçmiş — fərq etmir).
   */
  private countUsed(userId: string, categoryId: string, windowStart: Date): Promise<number> {
    return this.prisma.listing.count({
      where: { ownerId: userId, categoryId, createdAt: { gte: windowStart } },
    });
  }

  /**
   * Mağaza hesabı sayılma şərti: mağaza sətrinin MÖVCUDLUĞU (statusu deyil).
   * `pending` mağaza da mağazadır — təsdiq gözləyən sahibkarı fərdi satıcı
   * limitinə salmaq onu təsdiq növbəsinə görə cəzalandırmaq olardı.
   */
  private async hasStore(userId: string): Promise<boolean> {
    const store = await this.prisma.store.findUnique({
      where: { ownerId: userId },
      select: { id: true },
    });
    return store !== null;
  }

  /** Aktiv abunələrdən gələn ümumi elan kvotası (dövrü bitmişlər sayılmır). */
  private async subscriptionQuota(userId: string): Promise<number> {
    const agg = await this.prisma.subscription.aggregate({
      _sum: { quotaLeft: true },
      where: { userId, status: 'active', endsAt: { gt: new Date() } },
    });
    return agg._sum.quotaLeft ?? 0;
  }
}
