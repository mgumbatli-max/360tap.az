import { Injectable, Logger, OnModuleInit, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Prisma } from '@prisma/client';
import type { Index } from 'meilisearch';
import { MeiliSearch } from 'meilisearch';
import type { AppConfig } from '../config/configuration';
import { PrismaService } from '../prisma/prisma.service';

const INDEX = 'listings';

// Transliterasiya (latın/səhv yazılış → AZ) — yalnız real fərqli formalar (self-map yox)
const TRANSLIT: Record<string, string> = {
  masin: 'maşın', maşin: 'maşın', mashin: 'maşın',
  menzil: 'mənzil', kiraye: 'kirayə', telfon: 'telefon',
};

// Region tanıma: AZ slug/ad + RU + EN → region slug
const REGION_TOKENS: Record<string, string> = {
  // baki
  baki: 'baki', bakı: 'baki', baku: 'baki', баку: 'baki',
  // sumqayit
  sumqayit: 'sumqayit', sumqayıt: 'sumqayit', sumgait: 'sumqayit', сумгаит: 'sumqayit',
  // gence
  gence: 'gence', gəncə: 'gence', ganja: 'gence', гянджа: 'gence',
  // qebele
  qebele: 'qebele', qəbələ: 'qebele', gabala: 'qebele', габала: 'qebele',
  // quba
  quba: 'quba', guba: 'quba', губа: 'quba',
  // xacmaz
  xacmaz: 'xacmaz', xaçmaz: 'xacmaz', khachmaz: 'xacmaz', хачмаз: 'xacmaz',
  // lenkeran
  lenkeran: 'lenkeran', lənkəran: 'lenkeran', lenkoran: 'lenkeran', ленкорань: 'lenkeran',
  // seki
  seki: 'seki', şəki: 'seki', sheki: 'seki', шеки: 'seki',
  // mingecevir
  mingecevir: 'mingecevir', mingəçevir: 'mingecevir', мингечевир: 'mingecevir',
  // shamaxi
  shamaxi: 'shamaxi', şamaxı: 'shamaxi', shemakha: 'shamaxi', шемаха: 'shamaxi',
  // masalli
  masalli: 'masalli', masallı: 'masalli', масаллы: 'masalli',
  // oguz / ismayilli / goycay / qax
  oguz: 'oguz', oğuz: 'oguz', огуз: 'oguz',
  ismayilli: 'ismayilli', i̇smayıllı: 'ismayilli', исмаиллы: 'ismayilli',
  goycay: 'goycay', göyçay: 'goycay', гёйчай: 'goycay',
  qax: 'qax', гах: 'qax',
};

export interface SearchParams {
  q?: string;
  region?: string;
  vertical?: string;
  page?: number;
  limit?: number;
}

/**
 * AVAILABLE   — Meili qoşulub, indeks hazırdır (tam funksionallıq).
 * DEGRADED    — Meili əlçatmazdır, axtarış Postgres fallback-i ilə cavab verir.
 * UNAVAILABLE — Meili ümumiyyətlə konfiqurasiya olunmayıb.
 */
export type SearchStatus = 'available' | 'degraded' | 'unavailable';

/** Meili sorğuları üçün sərt limit — startup və request-lər asılı qalmasın. */
const MEILI_TIMEOUT_MS = 5_000;

@Injectable()
export class SearchService implements OnModuleInit {
  private readonly logger = new Logger('SearchService');
  private readonly client: MeiliSearch;
  private readonly configured: boolean;
  private status: SearchStatus;
  private lastError: string | null = null;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService<AppConfig, true>,
  ) {
    const m = config.get('meili', { infer: true });
    // localhost default-u production-da real servis deyil — "konfiqurasiya olunmayıb" sayılır.
    this.configured = Boolean(m.host) && !/localhost|127\.0\.0\.1/.test(m.host);
    this.status = this.configured ? 'degraded' : 'unavailable';
    this.client = new MeiliSearch({
      host: m.host,
      apiKey: m.key || undefined,
      timeout: MEILI_TIMEOUT_MS,
    });
  }

  private get index(): Index {
    return this.client.index(INDEX);
  }

  /** Cari vəziyyət — /health/ready üçün. */
  getStatus(): { status: SearchStatus; configured: boolean; lastError: string | null } {
    return { status: this.status, configured: this.configured, lastError: this.lastError };
  }

  isAvailable(): boolean {
    return this.status === 'available';
  }

  /**
   * Faza 0: init BLOKLAMIR. Əvvəl `await`-lə çağırılırdı və Meili host asılı
   * qalanda bütün Nest bootstrap-ı (deməli `app.listen()`-i də) dayandırırdı.
   */
  onModuleInit(): void {
    if (!this.configured) {
      this.logger.warn('MEILI_HOST konfiqurasiya olunmayıb — axtarış Postgres fallback-i ilə işləyəcək');
      return;
    }
    void this.initIndex();
  }

  private async initIndex(): Promise<void> {
    try {
      await this.client.createIndex(INDEX, { primaryKey: 'id' }).catch(() => undefined);
      await this.index.updateSettings({
        searchableAttributes: ['title', 'brand', 'model', 'categoryName', 'description', 'regionName'],
        filterableAttributes: ['vertical', 'categorySlug', 'regionSlug', 'districtId', 'source', 'inStock', 'isVip', 'price'],
        sortableAttributes: ['price', 'createdAt'],
        synonyms: {
          maşın: ['avtomobil', 'masin', 'avto'], avtomobil: ['maşın', 'masin'],
          telefon: ['smartfon', 'mobil'], smartfon: ['telefon'],
          ev: ['mənzil', 'menzil', 'həyət evi'], mənzil: ['ev', 'menzil'],
          kirayə: ['icarə', 'kiraye'],
          kompüter: ['noutbuk', 'laptop', 'komputer', 'macbook'],
          komputer: ['kompüter', 'noutbuk', 'laptop'],
          noutbuk: ['laptop', 'kompüter', 'komputer', 'macbook'],
          laptop: ['noutbuk', 'kompüter'],
          televizor: ['tv', 'televiziya'], tv: ['televizor'],
          paltar: ['geyim'], geyim: ['paltar'],
          iş: ['vakansiya', 'is'], vakansiya: ['iş'],
          ayfon: ['iphone'], aypad: ['ipad'], samsunq: ['samsung'],
          mersedes: ['mercedes'], bemve: ['bmw'],
        },
      });
      // Buraya çatdıqsa Meili cavab verir.
      this.status = 'available';
      this.lastError = null;
      this.logger.log('Meilisearch qoşuldu (status: available)');

      // İlk dəfə (index boşdursa) avtomatik populyasiya — Meili qoşulan kimi elanlar indekslənir
      const stats = await this.index.getStats().catch(() => null);
      if (stats && stats.numberOfDocuments === 0) {
        const n = await this.reindexActive().catch(() => 0);
        this.logger.log(`Meili ilk indeksləmə: ${n} elan`);
      }
    } catch (e) {
      this.status = 'degraded';
      this.lastError = String(e).slice(0, 300);
      this.logger.warn(
        `Meili init alınmadı — axtarış DEGRADED (Postgres fallback) rejimdədir: ${this.lastError}`,
      );
    }
  }

  // ---- indeksləmə (best-effort, əsas axını qırmır) ----

  async indexListing(id: string): Promise<void> {
    try {
      const l = await this.fetchForIndex(id);
      if (!l) return;
      if (l.status !== 'active') {
        await this.removeListing(id);
        return;
      }
      const task = await this.index.addDocuments([this.toDoc(l)]);
      await this.client.waitForTask(task.taskUid); // read-your-writes (publish→search dərhal görünsün)
    } catch (e) {
      this.logger.warn(`indexListing(${id}) alınmadı: ${String(e)}`);
    }
  }

  async removeListing(id: string): Promise<void> {
    try {
      const task = await this.index.deleteDocument(id);
      await this.client.waitForTask(task.taskUid);
    } catch (e) {
      this.logger.warn(`removeListing(${id}) alınmadı: ${String(e)}`);
    }
  }

  async reindexActive(): Promise<number> {
    if (!this.configured) {
      throw new ServiceUnavailableException('Meilisearch konfiqurasiya olunmayıb');
    }
    const ids = await this.prisma.listing.findMany({
      where: { status: 'active' },
      select: { id: true },
    });
    const docs = [];
    for (const { id } of ids) {
      const l = await this.fetchForIndex(id);
      if (l) docs.push(this.toDoc(l));
    }
    if (docs.length) {
      const task = await this.index.addDocuments(docs);
      await this.client.waitForTask(task.taskUid, { timeOutMs: 30_000 });
    }
    return docs.length;
  }

  // ---- axtarış ----

  async search(params: SearchParams) {
    const page = params.page ?? 1;
    const limit = Math.min(params.limit ?? 20, 50);
    const { cleaned, detectedRegion } = this.understand(params.q ?? '');
    const regionSlug = params.region ?? detectedRegion;

    // Filter injeksiyasının qarşısı: yalnız slug simvolları (Meili filter string-inə birbaşa girir)
    const safe = (s: string): string => s.replace(/[^a-z0-9_-]/gi, '').slice(0, 60);
    const filters: string[] = [];
    if (regionSlug) filters.push(`regionSlug = "${safe(regionSlug)}"`);
    if (params.vertical) filters.push(`vertical = "${safe(params.vertical)}"`);

    let hits: unknown[];
    let total: number;
    let degraded = false;

    if (this.configured) {
      try {
        const res = await this.index.search(cleaned, {
          filter: filters.length ? filters.join(' AND ') : undefined,
          limit,
          offset: (page - 1) * limit,
        });
        hits = res.hits;
        total = res.estimatedTotalHits ?? res.hits.length;
        if (this.status !== 'available') {
          this.status = 'available';
          this.lastError = null;
          this.logger.log('Meilisearch bərpa olundu (status: available)');
        }
      } catch (e) {
        this.status = 'degraded';
        this.lastError = String(e).slice(0, 300);
        this.logger.warn(`Meili axtarışı alınmadı, Postgres fallback: ${this.lastError}`);
        ({ hits, total } = await this.fallbackSearch(cleaned, regionSlug, params.vertical, page, limit));
        degraded = true;
      }
    } else {
      ({ hits, total } = await this.fallbackSearch(cleaned, regionSlug, params.vertical, page, limit));
      degraded = true;
    }

    // Tapılmayan axtarışları logla (doc 07 §3 — sinonim/kontent boşluğu aşkarı)
    if (total === 0 && cleaned.trim()) {
      await this.prisma.searchLog
        .create({ data: { query: (params.q ?? '').slice(0, 200), resultsCount: 0 } })
        .catch(() => undefined);
    }

    return {
      data: hits,
      meta: {
        page,
        limit,
        total,
        detectedRegion: regionSlug ?? null,
        query: cleaned,
        degraded, // true → nəticələr Meili yox, Postgres fallback-indəndir
      },
    };
  }

  /**
   * DEGRADED rejim: Meili əlçatmaz olduqda axtarış tamamilə dayanmır,
   * Postgres üzərindən sadə keyword axtarışı ilə cavab verilir.
   * (Typo-tolerance və sinonim yoxdur — bu, qəsdən məhdud fallback-dır.)
   */
  private async fallbackSearch(
    cleaned: string,
    regionSlug: string | null,
    vertical: string | undefined,
    page: number,
    limit: number,
  ): Promise<{ hits: unknown[]; total: number }> {
    const where: Prisma.ListingWhereInput = { status: 'active' };
    if (vertical) where.vertical = vertical;
    if (regionSlug) where.district = { region: { slug: regionSlug } };

    const words = cleaned.split(/\s+/).filter((w) => w.length > 1).slice(0, 5);
    if (words.length) {
      where.AND = words.map((w) => ({
        OR: [
          { title: { contains: w, mode: 'insensitive' as const } },
          { description: { contains: w, mode: 'insensitive' as const } },
          { category: { nameAz: { contains: w, mode: 'insensitive' as const } } },
        ],
      }));
    }

    try {
      const [rows, total] = await this.prisma.$transaction([
        this.prisma.listing.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
          select: {
            id: true, title: true, description: true, price: true, currency: true,
            vertical: true, status: true, source: true, inStock: true, isVip: true,
            districtId: true, attributes: true, createdAt: true, priceType: true,
            category: { select: { slug: true, nameAz: true } },
            district: { select: { region: { select: { slug: true, nameAz: true } } } },
            images: { select: { url: true }, orderBy: { sortOrder: 'asc' }, take: 1 },
          },
        }),
        this.prisma.listing.count({ where }),
      ]);
      return { hits: rows.map((r) => this.toDoc(r)), total };
    } catch (e) {
      // DB də əlçatmazdırsa axtarış boş qaytarır — endpoint 500 vermir.
      this.logger.error(`Fallback axtarış da alınmadı: ${String(e).slice(0, 200)}`);
      return { hits: [], total: 0 };
    }
  }

  // Sorğu anlama: region tanıma + transliterasiya
  understand(q: string): { cleaned: string; detectedRegion: string | null } {
    const tokens = q.toLowerCase().trim().split(/\s+/).filter(Boolean);
    let detectedRegion: string | null = null;
    const kept: string[] = [];
    for (const t of tokens) {
      if (REGION_TOKENS[t]) {
        detectedRegion = REGION_TOKENS[t];
        continue;
      }
      kept.push(TRANSLIT[t] ?? t);
    }
    return { cleaned: kept.join(' '), detectedRegion };
  }

  // ---- helpers ----

  private fetchForIndex(id: string) {
    return this.prisma.listing.findUnique({
      where: { id },
      select: {
        id: true, title: true, description: true, price: true, currency: true,
        vertical: true, status: true, source: true, inStock: true, isVip: true,
        districtId: true, attributes: true, createdAt: true, priceType: true,
        category: { select: { slug: true, nameAz: true } },
        district: { select: { region: { select: { slug: true, nameAz: true } } } },
        images: { select: { url: true }, orderBy: { sortOrder: 'asc' }, take: 1 },
      },
    });
  }

  private toDoc(l: NonNullable<Awaited<ReturnType<SearchService['fetchForIndex']>>>) {
    const attrs = (l.attributes ?? {}) as Record<string, unknown>;
    return {
      id: l.id,
      title: l.title,
      description: typeof l.description === 'string' ? l.description.slice(0, 500) : '',
      price: l.price ? Number(l.price) : null,
      priceType: l.priceType,
      currency: l.currency,
      cover: l.images[0]?.url ?? null,
      vertical: l.vertical,
      categorySlug: l.category.slug,
      categoryName: l.category.nameAz,
      regionSlug: l.district?.region?.slug ?? null,
      regionName: l.district?.region?.nameAz ?? null,
      districtId: l.districtId,
      source: l.source,
      inStock: l.inStock,
      isVip: l.isVip,
      brand: typeof attrs.brand === 'string' ? attrs.brand : null,
      model: typeof attrs.model === 'string' ? attrs.model : null,
      createdAt: l.createdAt.getTime(),
    };
  }
}
