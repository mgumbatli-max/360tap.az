import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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

@Injectable()
export class SearchService implements OnModuleInit {
  private readonly logger = new Logger('SearchService');
  private readonly client: MeiliSearch;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService<AppConfig, true>,
  ) {
    const m = config.get('meili', { infer: true });
    this.client = new MeiliSearch({ host: m.host, apiKey: m.key || undefined });
  }

  private get index(): Index {
    return this.client.index(INDEX);
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.client.createIndex(INDEX, { primaryKey: 'id' }).catch(() => undefined);
      await this.index.updateSettings({
        searchableAttributes: ['title', 'brand', 'model', 'categoryName', 'description', 'regionName'],
        filterableAttributes: ['vertical', 'categorySlug', 'regionSlug', 'districtId', 'source', 'inStock', 'isVip', 'price'],
        sortableAttributes: ['price', 'createdAt'],
        synonyms: {
          maşın: ['avtomobil'], avtomobil: ['maşın'],
          telefon: ['smartfon'], smartfon: ['telefon'],
          ev: ['mənzil', 'menzil'], mənzil: ['ev'],
          kirayə: ['icarə', 'kiraye'], noutbuk: ['laptop'], iş: ['vakansiya'],
          ayfon: ['iphone'], aypad: ['ipad'], samsunq: ['samsung'],
        },
      });
    } catch (e) {
      this.logger.warn(`Meili init alınmadı: ${String(e)}`);
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

    const res = await this.index.search(cleaned, {
      filter: filters.length ? filters.join(' AND ') : undefined,
      limit,
      offset: (page - 1) * limit,
    });

    const total = res.estimatedTotalHits ?? res.hits.length;

    // Tapılmayan axtarışları logla (doc 07 §3 — sinonim/kontent boşluğu aşkarı)
    if (total === 0 && cleaned.trim()) {
      await this.prisma.searchLog
        .create({ data: { query: (params.q ?? '').slice(0, 200), resultsCount: 0 } })
        .catch(() => undefined);
    }

    return {
      data: res.hits,
      meta: {
        page,
        limit,
        total,
        detectedRegion: regionSlug ?? null,
        query: cleaned,
      },
    };
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
        districtId: true, attributes: true, createdAt: true,
        category: { select: { slug: true, nameAz: true } },
        district: { select: { region: { select: { slug: true, nameAz: true } } } },
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
      currency: l.currency,
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
