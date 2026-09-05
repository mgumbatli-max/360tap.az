import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import type { AttributeType, ListingStatus } from '@prisma/client';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CategoriesService } from '../categories/categories.service';
import type { CreateListingDto } from './dto/create-listing.dto';
import { toListingResponse, type ListingResponse } from './dto/listing-response.dto';
import type { QueryListingsDto } from './dto/query-listings.dto';
import { uniqueSlug } from './utils/slug.util';
import { SearchService } from '../../search/search.service';
import { ListingLimitService } from '../billing/listing-limit.service';

const LISTING_TTL_DAYS = 30;

/** Sərbəst mətn atributunun maksimum uzunluğu (JSONB sətirini şişirtməmək üçün). */
const MAX_ATTRIBUTE_TEXT_LENGTH = 200;
/** multiselect üçün saxlanılan seçim sayı həddi. */
const MAX_MULTISELECT_VALUES = 20;
/** Kateqoriya atribut sxeminin keş ömrü. */
const ATTRIBUTE_SCHEMA_TTL_MS = 5 * 60 * 1000;

/** Atribut sanitizasiyası üçün lazım olan minimal sxem sətri. */
interface AttributeSchemaRow {
  key: string;
  type: AttributeType;
  options: Prisma.JsonValue;
  isRequired: boolean;
  labelAz: string;
}

/**
 * Kateqoriya atributlarının proses-daxili keşi.
 *
 * NİYƏ məhz belə: elan yaratma/redaktə yolunda əlavə DB sorğusu yaranır, amma
 * bu məlumat praktiki olaraq statikdir (yalnız admin sxemi dəyişəndə). Açar
 * sahəsi kateqoriya sayı ilə məhduddur (117 × ≤14 sətir), ona görə Map sonsuz
 * böyüyə bilmir — LRU/eviction siyasətinə ehtiyac yoxdur. Redis kimi xarici keş
 * bu qədər kiçik və nadir dəyişən data üçün əlavə şəbəkə gedişi deməkdir;
 * 5 dəqiqəlik TTL isə çox-instanslı deploy-da sxem dəyişikliyinin yayılma
 * gecikməsini məhdudlaşdırır (səhv nəticə yox, sadəcə qısa müddət köhnə sxem).
 */
const attributeSchemaCache = new Map<string, { rows: AttributeSchemaRow[]; expiresAt: number }>();

/** Test/admin üçün: sxem dəyişəndə keşi dərhal boşaltmaq imkanı. */
export function clearAttributeSchemaCache(): void {
  attributeSchemaCache.clear();
}

export interface ListMeta {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
  categoryName?: string;
}

/** Atribut options-undan icazəli dəyərləri çıxarır (massiv və ya {choices} formatı). */
function optionValues(options: unknown): string[] {
  if (Array.isArray(options)) {
    return options.filter((o): o is string => typeof o === 'string');
  }
  if (
    options &&
    typeof options === 'object' &&
    Array.isArray((options as { choices?: unknown }).choices)
  ) {
    return (options as { choices: unknown[] }).choices.filter(
      (o): o is string => typeof o === 'string',
    );
  }
  return [];
}

/** Rəqəmə çevirir; mümkün deyilsə `undefined` (dəyər atılacaq). */
function toNumber(value: unknown): number | undefined {
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
  // Formalar rəqəmi çox vaxt sətir kimi göndərir ("128") — bunu itirmək data itkisidir.
  if (typeof value === 'string') {
    const trimmed = value.trim().replace(',', '.');
    if (trimmed === '') return undefined;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

/** Boolean-a normallaşdırır; tanınmayan forma `undefined`. */
function toBoolean(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') {
    if (value === 1) return true;
    if (value === 0) return false;
    return undefined;
  }
  if (typeof value === 'string') {
    const v = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'bəli', 'beli'].includes(v)) return true;
    if (['false', '0', 'no', 'xeyr'].includes(v)) return false;
  }
  return undefined;
}

/** Sərbəst mətnə çevirir və uzunluğu kəsir; boş nəticə `undefined`. */
function toText(value: unknown): string | undefined {
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    const text = String(value).trim().slice(0, MAX_ATTRIBUTE_TEXT_LENGTH);
    return text === '' ? undefined : text;
  }
  return undefined; // obyekt/massiv sərbəst mətn sahəsinə yaraşmır
}

/**
 * Bir atribut dəyərini tipinə görə normallaşdırır.
 * Qaytarılan `undefined` = "dəyər yararsızdır, atılsın" (xəta atılmır).
 */
function coerceAttributeValue(attr: AttributeSchemaRow, value: unknown): unknown {
  switch (attr.type) {
    case 'number':
    case 'range':
      return toNumber(value);

    case 'boolean':
      return toBoolean(value);

    case 'select': {
      const text = toText(value);
      if (text === undefined) return undefined;
      const choices = optionValues(attr.options);
      // options boşdursa (məs. avtomobil markası) sahə sərbəst mətndir —
      // siyahı yoxdursa yoxlamaq da mümkün deyil.
      if (choices.length > 0 && !choices.includes(text)) return undefined;
      return text;
    }

    case 'multiselect': {
      if (!Array.isArray(value)) return undefined;
      const choices = optionValues(attr.options);
      const picked: string[] = [];
      for (const item of value) {
        const text = toText(item);
        if (text === undefined) continue;
        if (choices.length > 0 && !choices.includes(text)) continue;
        if (!picked.includes(text)) picked.push(text);
        if (picked.length >= MAX_MULTISELECT_VALUES) break;
      }
      return picked.length > 0 ? picked : undefined;
    }

    case 'date': {
      const text = toText(value);
      if (text === undefined || Number.isNaN(Date.parse(text))) return undefined;
      return text;
    }

    case 'location': {
      if (typeof value !== 'object' || value === null || Array.isArray(value)) return undefined;
      const lat = toNumber((value as { lat?: unknown }).lat);
      const lng = toNumber((value as { lng?: unknown }).lng);
      if (lat === undefined || lng === undefined) return undefined;
      return { lat, lng };
    }

    case 'string':
    default:
      return toText(value);
  }
}

/**
 * Göndərilən atributları kateqoriya sxeminə görə təmizləyir.
 *
 * Qaydalar:
 * - Yalnız sxemdəki açarlar saxlanılır; tanınmayanlar səssizcə atılır (xəta da,
 *   log da yoxdur) — köhnə mobil versiyalar sınmasın, log da spam-a çevrilməsin.
 *   Filtrlər `category_attributes` açarlarına güvəndiyi üçün zibil açar
 *   bazaya düşməməlidir.
 * - Tanınan açarın dəyəri tipə uyğun deyilsə həmin açar atılır (elan yenə yaranır).
 * - `isRequired` atribut yoxdursa və ya dəyəri yararsızdırsa 422 atılır.
 */
export function sanitizeAttributes(
  schema: AttributeSchemaRow[],
  raw: Record<string, unknown> | undefined,
): Record<string, unknown> {
  const input = raw ?? {};
  const clean: Record<string, unknown> = {};

  // Sxem üzərində dövr edirik (göndərilən açarlar üzərində yox) — beləliklə
  // tanınmayan açar heç emal olunmadan kənarda qalır.
  for (const attr of schema) {
    const coerced = Object.prototype.hasOwnProperty.call(input, attr.key)
      ? coerceAttributeValue(attr, input[attr.key])
      : undefined;

    if (coerced === undefined) {
      if (attr.isRequired) {
        throw new UnprocessableEntityException(
          `'${attr.labelAz}' sahəsi məcburidir və düzgün doldurulmalıdır (açar: ${attr.key})`,
        );
      }
      continue;
    }
    clean[attr.key] = coerced;
  }

  return clean;
}

@Injectable()
export class ListingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly categories: CategoriesService,
    private readonly search: SearchService,
    private readonly listingLimits: ListingLimitService,
  ) {}

  /**
   * Yeni elan yaradır.
   * Status: 'review' (moderasiya növbəsinə düşür).
   * Müddət: 30 gün.
   */
  async create(ownerId: string, dto: CreateListingDto): Promise<ListingResponse> {
    // 1. Kateqoriya doğrulaması (vertical-ı da qaytarır)
    const category = await this.categories.assertExists(dto.categoryId);

    // 1b. PULSUZ ELAN LİMİTİ — rəqiblərin əsas monetizasiya leveri
    // (tap.az: Maşınlar 1/ay · turbo.az: diler üçün limit yox, hər elan 30 AZN ·
    // Avito: kommersiya kateqoriyalarında 0).
    //
    // Mühərrik rəqəmi HƏMİŞƏ hesablayır, lakin `blocked` yalnız üç açar birlikdə
    // qalxdıqda `true` olur: `monetization.enabled` + `listing_limits.enabled` +
    // kateqoriyanın öz `enabled`-i. Platformada hazırda trafik yoxdur, ona görə
    // bayraqlar sönülüdür və bu yoxlama HEÇ KİMİ bloklamır — amma astana keçiləndə
    // admin panelindən bir düymə ilə işə düşür, deploy tələb etmir.
    const limit = await this.listingLimits.check(ownerId, dto.categoryId);
    if (limit.blocked) {
      throw new ForbiddenException(
        limit.limit != null
          ? `Bu kateqoriyada aylıq pulsuz elan limiti dolub (${limit.used}/${limit.limit}). Paket alaraq davam edə bilərsiniz.`
          : 'Bu kateqoriyada elan yerləşdirmək üçün aktiv paket tələb olunur.',
      );
    }

    // 2. Atributları kateqoriya sxeminə görə təmizlə.
    // Atributlar göndərilməsə də çağırılır — məcburi sahələrin çatışmazlığı
    // yalnız burada aşkarlanır.
    const attributes = await this.resolveAttributes(dto.categoryId, dto.attributes);

    // 3. Rayon yoxla (varsa)
    if (dto.districtId) {
      const district = await this.prisma.district.findUnique({
        where: { id: dto.districtId },
        select: { id: true },
      });
      if (!district) throw new BadRequestException('Rayon tapılmadı');
    }

    // 4. Mağaza bağlantısı — QIRIQ HALQA: `storeId` heç vaxt doldurulmurdu,
    // ona görə mağaza səhifəsi (`GET /stores/:slug/listings`) elan yerləşdirilsə
    // də ƏBƏDİ BOŞ qalırdı. Bağlantı sorğu gövdəsindən YOX, sahibin öz
    // mağazasından çıxarılır — beləliklə istifadəçi elanını başqasının mağazasına
    // yapışdıra bilmir.
    const storeId = await this.resolveOwnerStoreId(ownerId);

    // 5. Slug yarat
    const slug = uniqueSlug(dto.title);
    const expiresAt = new Date(Date.now() + LISTING_TTL_DAYS * 24 * 60 * 60 * 1000);

    // 6. Tranzaksiya: elan + şəkillər
    const created = await this.prisma.$transaction(async (tx) => {
      const listing = await tx.listing.create({
        data: {
          ownerId,
          storeId,
          categoryId: dto.categoryId,
          vertical: category.vertical,
          districtId: dto.districtId ?? null,
          title: dto.title,
          slug,
          description: dto.description,
          price: dto.price ?? null,
          currency: dto.currency ?? 'AZN',
          priceType: dto.priceType ?? 'fixed',
          condition: dto.condition ?? null,
          attributes: attributes as Prisma.InputJsonValue,
          hasDelivery: dto.hasDelivery ?? false,
          hasCredit: dto.hasCredit ?? false,
          hasBarter: dto.hasBarter ?? false,
          hasWarranty: dto.hasWarranty ?? false,
          // `inStock` sxemdə default `true`-dur (adi elan mövcud sayılır);
          // istifadəçi açıq şəkildə `false` desə də hörmət edilir.
          inStock: dto.inStock ?? true,
          oldPrice: dto.oldPrice ?? null,
          contactName: dto.contactName ?? null,
          contactPhone: dto.contactPhone ?? null,
          contactWhatsapp: dto.contactWhatsapp ?? false,
          address: dto.address ?? null,
          lat: dto.lat ?? null,
          lng: dto.lng ?? null,
          status: 'active', // avto-dərc (moderasiya sonra aktivləşdirilə bilər)
          expiresAt,
        },
      });

      if (dto.images?.length) {
        await tx.listingImage.createMany({
          data: dto.images.map((img, i) => ({
            listingId: listing.id,
            url: img.url,
            width: img.width ?? null,
            height: img.height ?? null,
            blurHash: img.blurHash ?? null,
            sortOrder: i,
          })),
        });
      }

      return tx.listing.findUniqueOrThrow({
        where: { id: listing.id },
        include: { images: { orderBy: { sortOrder: 'asc' } }, category: { select: { nameAz: true, slug: true } }, district: { select: { nameAz: true, slug: true, region: { select: { nameAz: true, slug: true } } } } },
      });
    });

    void this.search.indexListing(created.id); // best-effort, axını qırmır
    return toListingResponse(created);
  }

  /**
   * Sahibin AKTİV mağazasının id-si (yoxdursa `null`).
   *
   * NİYƏ yalnız `active`: `pending` mağaza hələ təsdiqlənməyib, `suspended` isə
   * dayandırılıb — hər iki halda mağaza vitrini ictimaiyyətə bağlıdır, elanı ora
   * bağlamaq onu görünməz edərdi. Elan bu halda sadə şəxsi elan kimi yaşayır.
   */
  private async resolveOwnerStoreId(ownerId: string): Promise<string | null> {
    const store = await this.prisma.store.findUnique({
      where: { ownerId },
      select: { id: true, status: true },
    });
    return store && store.status === 'active' ? store.id : null;
  }

  /**
   * Kateqoriyanın atribut sxemini keşlə oxuyur.
   * Keşin əsaslandırması yuxarıda `attributeSchemaCache` şərhindədir.
   */
  private async loadAttributeSchema(categoryId: string): Promise<AttributeSchemaRow[]> {
    const cached = attributeSchemaCache.get(categoryId);
    if (cached && cached.expiresAt > Date.now()) return cached.rows;

    const rows = await this.prisma.categoryAttribute.findMany({
      where: { categoryId },
      select: { key: true, type: true, options: true, isRequired: true, labelAz: true },
    });
    attributeSchemaCache.set(categoryId, { rows, expiresAt: Date.now() + ATTRIBUTE_SCHEMA_TTL_MS });
    return rows;
  }

  /** Sxemi oxuyub atributları təmizləyir — DB-yə yalnız təmiz obyekt yazılır. */
  private async resolveAttributes(
    categoryId: string,
    attributes: Record<string, unknown> | undefined,
  ): Promise<Record<string, unknown>> {
    const schema = await this.loadAttributeSchema(categoryId);
    return sanitizeAttributes(schema, attributes);
  }

  // Public: yalnız aktiv elan. Qeyri-aktiv (draft/review/...) anonim istifadəçiyə 404.
  async findById(id: string): Promise<ListingResponse | null> {
    const listing = await this.prisma.listing.findFirst({
      where: { id, status: 'active' },
      include: { images: { orderBy: { sortOrder: 'asc' } }, category: { select: { nameAz: true, slug: true } }, district: { select: { nameAz: true, slug: true, region: { select: { nameAz: true, slug: true } } } } },
    });
    if (!listing) return null;
    // Baxış sayğacını artır (best-effort)
    void this.prisma.listing
      .update({ where: { id }, data: { views: { increment: 1 } } })
      .catch(() => undefined);
    return toListingResponse(listing);
  }

  // Oxşar elanlar — eyni kateqoriya, aktiv, cari elan istisna
  async findSimilar(id: string, limit = 8): Promise<ListingResponse[]> {
    const listing = await this.prisma.listing.findUnique({
      where: { id },
      select: { categoryId: true },
    });
    if (!listing) return [];
    const items = await this.prisma.listing.findMany({
      where: { status: 'active', categoryId: listing.categoryId, id: { not: id } },
      orderBy: [{ isVip: 'desc' }, { createdAt: 'desc' }],
      take: limit,
      include: { images: { orderBy: { sortOrder: 'asc' }, take: 1 }, category: { select: { nameAz: true, slug: true } }, district: { select: { nameAz: true, slug: true, region: { select: { nameAz: true, slug: true } } } } },
    });
    return items.map(toListingResponse);
  }

  async listByOwner(ownerId: string): Promise<ListingResponse[]> {
    const items = await this.prisma.listing.findMany({
      where: { ownerId },
      orderBy: { createdAt: 'desc' },
      include: { images: { orderBy: { sortOrder: 'asc' }, take: 1 }, category: { select: { nameAz: true, slug: true } }, district: { select: { nameAz: true, slug: true, region: { select: { nameAz: true, slug: true } } } } },
    });
    return items.map(toListingResponse);
  }

  // Status dəyişdir (sahiblik yoxlaması ilə) — satıldı/arxiv/aktiv
  async setStatus(ownerId: string, id: string, status: ListingStatus): Promise<ListingResponse> {
    const listing = await this.prisma.listing.findUnique({
      where: { id },
      select: { ownerId: true },
    });
    if (!listing) throw new NotFoundException('Elan tapılmadı');
    if (listing.ownerId !== ownerId) throw new ForbiddenException('Bu elan sizə aid deyil');
    const updated = await this.prisma.listing.update({
      where: { id },
      data: { status },
      include: { images: { orderBy: { sortOrder: 'asc' }, take: 1 }, category: { select: { nameAz: true, slug: true } }, district: { select: { nameAz: true, slug: true, region: { select: { nameAz: true, slug: true } } } } },
    });
    void this.search.indexListing(updated.id); // status dəyişdi → index yenilə/sil
    return toListingResponse(updated);
  }

  // Elanı redaktə et (sahiblik yoxlaması ilə) — mətn/qiymət/kateqoriya/atribut
  async update(
    ownerId: string,
    id: string,
    dto: import('./dto/update-listing.dto').UpdateListingDto,
  ): Promise<ListingResponse> {
    const listing = await this.prisma.listing.findUnique({
      where: { id },
      // categoryId lazımdır: atributlar dəyişəndə hansı sxemə görə təmizlənəcəyini
      // kateqoriya təyin edir, DTO-da isə kateqoriya göndərilməyə də bilər.
      // storeId lazımdır: yaratma anında mağazası olmayan (və ya mağazası hələ
      // təsdiqlənməmiş) istifadəçinin köhnə elanları redaktədə mağazaya qoşulur —
      // əks halda davranış yaratma və redaktə arasında ziddiyyətli qalırdı.
      select: { ownerId: true, categoryId: true, storeId: true },
    });
    if (!listing) throw new NotFoundException('Elan tapılmadı');
    if (listing.ownerId !== ownerId) throw new ForbiddenException('Bu elan sizə aid deyil');

    const data: Prisma.ListingUncheckedUpdateInput = {};

    // Yalnız BOŞ bağlantı doldurulur, mövcud bağlantı heç vaxt qırılmır:
    // mağaza müvəqqəti dayandırılanda elanın mənşəyini itirmək olmaz — vitrinin
    // gizlədilməsi onsuz da mağaza statusuna görə baş verir.
    if (listing.storeId === null) {
      const storeId = await this.resolveOwnerStoreId(ownerId);
      if (storeId) data.storeId = storeId;
    }
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.price !== undefined) data.price = dto.price ?? null;
    if (dto.priceType !== undefined) data.priceType = dto.priceType;
    if (dto.condition !== undefined) data.condition = dto.condition;
    if (dto.categoryId !== undefined) data.categoryId = dto.categoryId;
    if (dto.districtId !== undefined) data.districtId = dto.districtId ?? null;
    // Redaktədə də eyni təmizləmə işləyir — əks halda yaratma yolunda bağlanan
    // qapı PATCH ilə açıq qalırdı.
    if (dto.attributes !== undefined) {
      const clean = await this.resolveAttributes(
        dto.categoryId ?? listing.categoryId,
        dto.attributes,
      );
      data.attributes = clean as Prisma.InputJsonValue;
    }

    const updated = await this.prisma.listing.update({
      where: { id },
      data,
      include: { images: { orderBy: { sortOrder: 'asc' }, take: 1 }, category: { select: { nameAz: true, slug: true } }, district: { select: { nameAz: true, slug: true, region: { select: { nameAz: true, slug: true } } } } },
    });
    void this.search.indexListing(updated.id); // redaktə → index yenilə
    return toListingResponse(updated);
  }

  /**
   * Region-first listing axtarışı + filter + pagination.
   * Yalnız aktiv elanlar. Region slug → rayon id-lərinə açılır.
   */
  async findAll(q: QueryListingsDto): Promise<{ data: ListingResponse[]; meta: ListMeta }> {
    const page = q.page ?? 1;
    const limit = Math.min(q.limit ?? 20, 50);

    const where: Prisma.ListingWhereInput = { status: 'active' };

    if (q.district) {
      where.districtId = q.district;
    } else if (q.region) {
      const region = await this.prisma.region.findUnique({
        where: { slug: q.region },
        select: { isActive: true, districts: { select: { id: true } } },
      });
      // Səhv/qeyri-aktiv region slug → 404 (boş nəticədən fərqləndirmək üçün)
      if (!region || !region.isActive) {
        throw new NotFoundException(`Region tapılmadı: ${q.region}`);
      }
      where.districtId = { in: region.districts.map((d) => d.id) };
    }

    let categoryName: string | undefined;
    if (q.category) {
      const cat = await this.prisma.category.findUnique({
        where: { slug: q.category },
        select: { id: true, nameAz: true },
      });
      if (cat) {
        categoryName = cat.nameAz;
        // Bütün alt-ağacı (istənilən dərinlik) daxil et — kök kateqoriya öz nəvə leaf-lərini də göstərsin
        // (məs. elektronika → telefonlar → mobil-telefonlar). Əvvəl yalnız birbaşa uşaqlar daxil idi.
        const all = await this.prisma.category.findMany({ select: { id: true, parentId: true } });
        const childrenOf = new Map<string, string[]>();
        for (const c of all) {
          if (c.parentId) {
            const arr = childrenOf.get(c.parentId) ?? [];
            arr.push(c.id);
            childrenOf.set(c.parentId, arr);
          }
        }
        const ids = [cat.id];
        const queue = [cat.id];
        while (queue.length) {
          const cur = queue.shift()!;
          for (const ch of childrenOf.get(cur) ?? []) {
            ids.push(ch);
            queue.push(ch);
          }
        }
        where.categoryId = { in: ids };
      } else {
        where.categoryId = { in: [] };
      }
    }

    if (q.vertical) where.vertical = q.vertical;
    if (q.source) where.source = q.source;

    // Ani keyword axtarış (title VƏ YA description, sözlər OR)
    if (q.q) {
      const words = q.q
        .trim()
        .split(/\s+/)
        .filter((w) => w.length >= 2)
        .slice(0, 6);
      if (words.length) {
        where.OR = words.flatMap((w) => [
          { title: { contains: w, mode: 'insensitive' as const } },
          { description: { contains: w, mode: 'insensitive' as const } },
          { category: { nameAz: { contains: w, mode: 'insensitive' as const } } },
        ]);
      }
    }

    // Kateqoriya-spesifik atribut filtrləri — scalar (equals) və range {min,max} (gte/lte)
    if (q.attrs) {
      try {
        const parsed = JSON.parse(q.attrs) as Record<string, unknown>;
        const conds: Prisma.ListingWhereInput[] = [];
        for (const [key, value] of Object.entries(parsed)) {
          if (value == null || value === '') continue;
          if (typeof value === 'object' && !Array.isArray(value)) {
            const v = value as { min?: number; max?: number };
            if (v.min != null) conds.push({ attributes: { path: [key], gte: v.min } });
            if (v.max != null) conds.push({ attributes: { path: [key], lte: v.max } });
          } else {
            conds.push({ attributes: { path: [key], equals: value as Prisma.InputJsonValue } });
          }
        }
        if (conds.length) where.AND = conds;
      } catch {
        /* yanlış JSON → atribut filtri tətbiq olunmur */
      }
    }

    if (q.priceMin != null || q.priceMax != null) {
      const price: Prisma.DecimalNullableFilter = {};
      if (q.priceMin != null) price.gte = q.priceMin;
      if (q.priceMax != null) price.lte = q.priceMax;
      where.price = price;
    }

    // price nullable-dır ("razılaşma yolu ilə" elanlarda NULL). Postgres-in default davranışı
    // DESC üçün NULLS FIRST-dir — ona görə "Baha əvvəl" sıralaması qiymətsiz elanları başa atırdı.
    // nulls: 'last' hər iki istiqamətdə qiymətsizləri sona salır (ASC-də də açıq yazılır ki,
    // davranış DB default-undan asılı qalmasın). views/createdAt NOT NULL-dur — onlara lazım deyil.
    const orderBy: Prisma.ListingOrderByWithRelationInput =
      q.sort === 'price_asc'
        ? { price: { sort: 'asc', nulls: 'last' } }
        : q.sort === 'price_desc'
          ? { price: { sort: 'desc', nulls: 'last' } }
          : q.sort === 'popular'
            ? { views: 'desc' }
            : { createdAt: 'desc' };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.listing.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: { images: { orderBy: { sortOrder: 'asc' }, take: 1 }, category: { select: { nameAz: true, slug: true } }, district: { select: { nameAz: true, slug: true, region: { select: { nameAz: true, slug: true } } } } },
      }),
      this.prisma.listing.count({ where }),
    ]);

    return {
      data: items.map(toListingResponse),
      meta: { page, limit, total, hasMore: page * limit < total, categoryName },
    };
  }
}
