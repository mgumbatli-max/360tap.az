import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { ListingsService } from '../listings/listings.service';
import { NotificationsService } from '../notifications/notifications.service';
import { savedQueryToDto } from './query-translate';

/**
 * SAXLANMIŞ AXTARIŞ → «YENİ UYĞUN ELAN» BİLDİRİŞİ.
 *
 * PROBLEM: `SavedSearch` modeli, `notify` bayrağı və `lastNotifiedAt` sahəsi
 * ilk gündən sxemdə var idi (`schema.prisma:610-622`), CRUD API-si də işləyirdi —
 * lakin axtarışı yeni elanlarla tutuşduran BİR SƏTİR KOD BELƏ yox idi. Yəni
 * istifadəçi «axtarışı saxla» düyməsini basırdı və heç vaxt heç nə almırdı.
 *
 * NİYƏ `ListingsService.findAll()` TƏKRAR İSTİFADƏ OLUNUR: filtr məntiqi
 * (kateqoriya, region, qiymət, atributlar, diakritiksiz axtarış) mürəkkəbdir və
 * artıq bir yerdə yaşayır. Onu burada təkrar yazmaq iki nüsxə yaradardı və
 * zamanla fərqlənərdilər — istifadəçi axtarış səhifəsində görmədiyi elan üçün
 * bildiriş alardı. Ona görə uyğunluq TAM EYNİ metodla hesablanır.
 *
 * NİYƏ `sort: 'new'` + kiçik `limit`: bizə tam siyahı lazım deyil, «sonuncu
 * bildirişdən sonra yeni nə var?» sualının cavabı lazımdır. Ən yeniləri götürüb
 * tarixə görə süzmək kifayətdir və bazaya minimal yük salır.
 */
@Injectable()
export class SavedSearchAlertsService {
  private readonly logger = new Logger('SavedSearchAlerts');

  /** Bir dövrədə bir axtarış üçün baxılan maksimum yeni elan sayı. */
  private static readonly SCAN_LIMIT = 20;

  constructor(
    private readonly prisma: PrismaService,
    private readonly listings: ListingsService,
    private readonly notifications: NotificationsService,
  ) {}

  /**
   * NİYƏ 15 DƏQİQƏ: elan axını real vaxt deyil — istifadəçi üçün «15 dəqiqə
   * əvvəl çıxdı» ilə «indi çıxdı» arasında praktiki fərq yoxdur. Daha tez-tez
   * işlətmək pulsuz planda bazaya boş yük salar.
   */
  @Cron('*/15 * * * *', { name: 'saved-search-alerts' })
  async handleCron(): Promise<void> {
    const res = await this.run();
    if (res.notified || res.failed) {
      this.logger.log(
        `saxlanmış axtarış: ${res.checked} yoxlanıldı · ${res.notified} bildiriş · ${res.failed} xəta`,
      );
    }
  }

  /**
   * Cron-dan ayrıca metod: testdən və (gələcəkdə) admin panelindən əl ilə
   * çağırıla bilsin. Heç vaxt throw etmir — bir axtarışın xətası qalanları
   * dayandırmamalıdır.
   */
  async run(): Promise<{ checked: number; notified: number; failed: number }> {
    const searches = await this.prisma.savedSearch.findMany({
      where: { notify: true },
      select: { id: true, userId: true, name: true, query: true, lastNotifiedAt: true, createdAt: true },
    });

    let notified = 0;
    let failed = 0;

    for (const search of searches) {
      try {
        // Başlanğıc nöqtəsi: sonuncu bildiriş, yoxdursa axtarışın yaradılma anı.
        // `createdAt`-a düşmək vacibdir — əks halda ilk dövrədə KATALOQUN HAMISI
        // «yeni» sayılıb istifadəçiyə nəhəng bildiriş göndərilərdi.
        const since = search.lastNotifiedAt ?? search.createdAt;

        const dto = savedQueryToDto(search.query as Record<string, unknown>);
        const result = await this.listings.findAll({
          ...dto,
          sort: 'new',
          page: 1,
          limit: SavedSearchAlertsService.SCAN_LIMIT,
        });

        const fresh = (result.data ?? []).filter((l) => {
          const published = (l as { publishedAt?: Date | string | null }).publishedAt;
          if (!published) return false;
          return new Date(published).getTime() > since.getTime();
        });

        if (!fresh.length) continue;

        const label = search.name?.trim() || 'Saxladığınız axtarış';
        const count = fresh.length;
        const suffix = count >= SavedSearchAlertsService.SCAN_LIMIT ? '+' : '';

        await this.notifications.create(
          search.userId,
          'saved_search',
          `${label} üzrə ${count}${suffix} yeni elan`,
          'Yeni elanlara baxmaq üçün toxunun.',
          { savedSearchId: search.id, count, listingIds: fresh.slice(0, 5).map((l) => l.id) },
        );

        await this.prisma.savedSearch.update({
          where: { id: search.id },
          data: { lastNotifiedAt: new Date() },
        });
        notified += 1;
      } catch (e) {
        // Bir axtarışın sorğusu yararsız ola bilər (köhnə format, əl ilə redaktə).
        // Onun ucbatından qalan istifadəçilər bildirişsiz qalmamalıdır.
        failed += 1;
        this.logger.warn(
          `saxlanmış axtarış ${search.id} işlənmədi: ${e instanceof Error ? e.message : String(e)}`,
        );
      }
    }

    return { checked: searches.length, notified, failed };
  }
}
