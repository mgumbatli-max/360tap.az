import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

/**
 * «ELANINIZIN MÜDDƏTİ BİTİR» XATIRLATMASI.
 *
 * NİYƏ LAZIMDIR: `Listing.expiresAt` sxemdə məcburi sahədir, lakin məhsulda heç bir
 * yerdə istifadə olunmurdu (DAVAM.md-də açıq məsələ kimi qeyd olunub). Satıcı elanının
 * nə vaxt görünməz olacağını bilmir.
 *
 * ƏSAS RİSK — KÜTLƏVİ BİLDİRİŞ. DAVAM.md canlıda kataloqun böyük hissəsinin
 * `expiresAt`-ının artıq KEÇMİŞ olduğunu qeyd edir. Sadəlövh sorğu («müddəti yaxın
 * olanlar») ilk işə düşmədə minlərlə istifadəçiyə eyni anda bildiriş göndərərdi.
 * İki qoruma qoyulub:
 *
 *  1. `expiresAt > indi` — vaxtı ARTIQ keçmiş elanlar sorğuya ÜMUMİYYƏTLƏ daxil olmur.
 *     Şərt sorğunun özündədir, nəticəni sonradan süzmək kifayət deyil: minlərlə sətir
 *     bazadan boş yerə çəkilərdi.
 *  2. Son 7 gündə həmin elan üçün artıq xatırlatma göndərilibsə təkrarlanmır — cron
 *     gündəlik işlədiyi üçün əks halda istifadəçi üç gün üst-üstə eyni mesajı alardı.
 */
@Injectable()
export class ExpiryAlertsService {
  private readonly logger = new Logger('ExpiryAlerts');

  /** Neçə gün qalmış xatırladılsın. */
  private static readonly WARN_DAYS = 3;

  /** Eyni elan üçün təkrar xatırlatma arasındakı minimum müddət (gün). */
  private static readonly REPEAT_COOLDOWN_DAYS = 7;

  /** Bir dövrədə emal olunan maksimum elan — pulsuz planda bazanı qorumaq üçün. */
  private static readonly BATCH_LIMIT = 200;

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  /**
   * NİYƏ GÜNDƏ BİR DƏFƏ və niyə səhər: xatırlatma təcili deyil, günün istənilən
   * anında eyni dəyəri verir. Səhər saatı seçilib ki, istifadəçi gün ərzində
   * elanını yeniləməyə vaxt tapsın.
   */
  @Cron(CronExpression.EVERY_DAY_AT_9AM, { name: 'expiry-alerts' })
  async handleCron(): Promise<void> {
    const res = await this.run();
    if (res.notified || res.failed) {
      this.logger.log(`müddət xatırlatması: ${res.notified} göndərildi · ${res.failed} xəta`);
    }
  }

  async run(): Promise<{ notified: number; failed: number }> {
    const now = new Date();
    const until = new Date(now.getTime() + ExpiryAlertsService.WARN_DAYS * 86_400_000);

    const listings = await this.prisma.listing.findMany({
      where: {
        status: 'active',
        // `gt: now` — vaxtı keçmişlər KƏNARDA (yuxarıdakı 1-ci qoruma).
        expiresAt: { gt: now, lte: until },
      },
      select: { id: true, ownerId: true, title: true, expiresAt: true },
      orderBy: { expiresAt: 'asc' },
      take: ExpiryAlertsService.BATCH_LIMIT,
    });

    if (!listings.length) return { notified: 0, failed: 0 };

    // 2-ci qoruma: son 7 gündə xatırladılanları çıxarırıq.
    const cooldownSince = new Date(
      now.getTime() - ExpiryAlertsService.REPEAT_COOLDOWN_DAYS * 86_400_000,
    );
    const recent = await this.prisma.notification.findMany({
      where: { type: 'listing_expiring', createdAt: { gte: cooldownSince } },
      select: { data: true },
    });
    const alreadyNotified = new Set(
      recent
        .map((n) => (n.data as { listingId?: string } | null)?.listingId)
        .filter((id): id is string => typeof id === 'string'),
    );

    let notified = 0;
    let failed = 0;

    for (const listing of listings) {
      if (alreadyNotified.has(listing.id)) continue;
      try {
        const daysLeft = Math.max(
          1,
          Math.ceil((listing.expiresAt.getTime() - now.getTime()) / 86_400_000),
        );
        await this.notifications.create(
          listing.ownerId,
          'listing_expiring',
          `«${listing.title}» elanının müddəti ${daysLeft} gün sonra bitir`,
          'Elanı yeniləyin ki, axtarışlarda görünməyə davam etsin.',
          { listingId: listing.id, daysLeft },
        );
        notified += 1;
      } catch (e) {
        failed += 1;
        this.logger.warn(
          `elan ${listing.id} üçün xatırlatma göndərilmədi: ${e instanceof Error ? e.message : String(e)}`,
        );
      }
    }

    return { notified, failed };
  }
}
