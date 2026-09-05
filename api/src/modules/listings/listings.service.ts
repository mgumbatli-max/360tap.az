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
import { azKeywordOr, azSearchWords } from '../../search/az-text';
import { isSafeSlug } from '../geo/utils/slug';
import { CategoriesService } from '../categories/categories.service';
import type { CreateListingDto } from './dto/create-listing.dto';
import { toListingResponse, type ListingResponse } from './dto/listing-response.dto';
import type { QueryListingsDto } from './dto/query-listings.dto';
import { uniqueSlug } from './utils/slug.util';
import { SearchService } from '../../search/search.service';
import { ListingLimitService } from '../billing/listing-limit.service';
import { NotificationsService } from '../notifications/notifications.service';

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

/**
 * Elan sahibinin ÖZ elanı üçün icazəli status keçidləri (mənbə → hədəf).
 *
 * NİYƏ cədvəl: əvvəl `setStatus` yalnız sahibliyi yoxlayır, mənbə statusa isə heç
 * baxmırdı — moderasiya növbəsindəki (`review`) və ya rədd/blok edilmiş elanın sahibi
 * `POST /listings/:id/reactivate` ilə onu bir sorğuda özü dərc edə bilirdi, yəni
 * moderasiya darvazası tam bypass olunurdu. Alternativ (yalnız `reactivate` ucunu
 * bağlamaq) rədd edildi: `sold`/`archive` ucları da eyni funksiyadan keçir, ona görə
 * qapı mərkəzdə bağlanır.
 *
 * Cədvəldə OLMAYAN mənbə status (review/rejected/blocked/draft) = sahib üçün bağlıdır;
 * belə keçidlər moderator/admin işidir.
 *
 * `archived → active` və `sold → active` MÜTLƏQ açıq qalmalıdır — profil səhifəsindəki
 * «Aktivləşdir» düyməsi məhz bu iki keçidə söykənir (frontend/app/profil/elanlarim).
 * `expired` gələcəkdə müddət tətbiqi işə düşəndə elanın kilidlənməməsi üçün əvvəlcədən
 * cədvəldədir.
 */
const OWNER_STATUS_TRANSITIONS: Partial<Record<ListingStatus, ListingStatus[]>> = {
  active: ['sold', 'archived'],
  sold: ['active', 'archived'],
  archived: ['active'],
  out_of_stock: ['archived'],
  expired: ['active', 'archived'],
};

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
    private readonly notifications: NotificationsService,
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
          // `status: 'active'` yazılırdı, amma `publishedAt` boş qalırdı — ERP yolu
          // (erp.service.ts) onu həmişə doldurur, yəni eyni kod bazasında iki yazma
          // yolu arasındakı ziddiyyət unutmadan yaranmışdı. Sitemap `lastmod`,
          // hesabatlar və «nə vaxt dərc olunub» məntiqi bu sahəyə söykənir.
          publishedAt: new Date(),
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

  /**
   * Elanı id ilə oxuyur.
   *
   * Anonim (`viewerId` yoxdur): yalnız `active` elan — draft/review/archived kənar
   * gözə görünməməlidir. Sahib öz elanını statusundan asılı olmayaraq görməlidir,
   * əks halda profil → «Bax»/«Redaktə» axını arxivlənmiş elanda 404-ə düşür.
   *
   * DİQQƏT: OR budağı YALNIZ real `viewerId` olduqda əlavə olunur. `ownerId: undefined`
   * yazsaydıq Prisma həmin şərti tamamilə söndürər və bütün qeyri-aktiv elanlar
   * hamıya açılardı — bu, düzəlişin ən böyük riskidir, ona görə şərt açıq yazılıb.
   */
  async findById(id: string, viewerId?: string): Promise<ListingResponse | null> {
    const where: Prisma.ListingWhereInput = viewerId
      ? { id, OR: [{ status: 'active' }, { ownerId: viewerId }] }
      : { id, status: 'active' };

    const listing = await this.prisma.listing.findFirst({
      where,
      include: { images: { orderBy: { sortOrder: 'asc' } }, category: { select: { nameAz: true, slug: true } }, district: { select: { nameAz: true, slug: true, region: { select: { nameAz: true, slug: true } } } } },
    });
    if (!listing) return null;
    // Baxış sayğacını artır (best-effort). Sahibin öz baxışları sayılmır —
    // əks halda redaktə/önbaxış gedişləri statistikanı şişirdərdi.
    if (listing.ownerId !== viewerId) {
      void this.prisma.listing
        .update({ where: { id }, data: { views: { increment: 1 } } })
        .catch(() => undefined);
    }
    return toListingResponse(listing);
  }

  // Oxşar elanlar — eyni kateqoriya, aktiv, cari elan istisna
  async findSimilar(id: string, limit = 8): Promise<ListingResponse[]> {
    const listing = await this.prisma.listing.findUnique({
      where: { id },
      select: { categoryId: true },
    });
    // Mövcud olmayan elan üçün əvvəl 200 + boş massiv qayıdırdı, halbuki eyni id
    // üçün `GET /listings/:id` düzgün 404 verirdi — «tapılmadı» ilə «oxşarı yoxdur»
    // eyni cavaba düşürdü. Mənbə elana `status: 'active'` şərti ƏLAVƏ EDİLMƏDİ:
    // sahib öz arxiv elanına baxanda oxşarların itməsi ayrıca məhsul qərarıdır.
    if (!listing) throw new NotFoundException('Elan tapılmadı');
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

  // Status dəyişdir (sahiblik + icazəli keçid yoxlaması ilə) — satıldı/arxiv/aktiv
  async setStatus(ownerId: string, id: string, status: ListingStatus): Promise<ListingResponse> {
    const listing = await this.prisma.listing.findUnique({
      where: { id },
      // status: icazəli keçid cədvəli üçün; publishedAt: ilk dərc tarixi bir dəfə yazılır
      select: { ownerId: true, status: true, publishedAt: true },
    });
    if (!listing) throw new NotFoundException('Elan tapılmadı');
    if (listing.ownerId !== ownerId) throw new ForbiddenException('Bu elan sizə aid deyil');

    // Moderasiya darvazası: izahat OWNER_STATUS_TRANSITIONS şərhindədir.
    if (listing.status !== status) {
      const allowed = OWNER_STATUS_TRANSITIONS[listing.status] ?? [];
      if (!allowed.includes(status)) {
        throw new ForbiddenException(
          'Bu elanın statusunu dəyişmək mümkün deyil — elan moderasiyadadır və ya bu keçidə icazə yoxdur',
        );
      }
    }

    const updated = await this.prisma.listing.update({
      where: { id },
      data: {
        status,
        // İlk dəfə aktivləşəndə dərc tarixi yazılır; təkrar aktivləşdirmə onu
        // sıfırlamır (`??`) — «nə vaxt dərc olunub» tarixçəsi qorunur.
        ...(status === 'active' && listing.publishedAt === null
          ? { publishedAt: new Date() }
          : {}),
      },
      // `take: 1` GÖTÜRÜLDÜ: bu endpoint tam `ListingResponse` qaytarır və create/findById
      // ilə eyni tamlıqda olmalıdır — əks halda eyni tip endpoint-dən asılı olaraq
      // 1 və ya bütün şəkillərlə gəlirdi. Siyahı endpoint-lərində `take: 1` qalır.
      include: { images: { orderBy: { sortOrder: 'asc' } }, category: { select: { nameAz: true, slug: true } }, district: { select: { nameAz: true, slug: true, region: { select: { nameAz: true, slug: true } } } } },
    });
    void this.search.indexListing(updated.id); // status dəyişdi → index yenilə/sil

    // Elan `active`-dən çıxdı → onu sevimlilərə salanlara xəbər ver.
    // NİYƏ BURADA: köhnə status (`listing.status`) bu metodda ONSUZ DA oxunub,
    // yəni əlavə sorğu yoxdur və dəyişiklik məhz burada bilinir.
    // NİYƏ `void`: bildiriş göndərilməsi statusun dəyişməsini GECİKDİRMƏMƏLİDİR
    // və uğursuzluğu onu poza bilməz — `notifyFavoritesOfStatusChange` özü heç vaxt
    // throw etmir.
    if (listing.status === 'active' && status !== 'active') {
      await this.notifyFavoritesOfStatusChange(id, ownerId, updated.title, status);
    }

    return toListingResponse(updated);
  }

  /**
   * Sevimlilərə salınmış elanın statusu dəyişdi — maraqlananlara bildiriş.
   *
   * NİYƏ YALNIZ `active` → başqa status: istifadəçi üçün dəyərli xəbər elanın
   * ƏLÇATMAZ olmasıdır (satıldı/arxivləndi). Əks istiqamət (yenidən aktivləşmə)
   * ilk baxışdan faydalı görünsə də, satıcının hər aktivləşdirməsi kütləvi
   * bildirişə çevrilərdi — bu, spam olardı.
   *
   * NİYƏ SAHİB İSTİSNA OLUNUR: elanı arxivləyən şəxsin özünə «elan arxivləndi»
   * bildirişi göndərmək mənasızdır.
   *
   * HEÇ VAXT THROW ETMİR: status dəyişikliyi baş verib, bildiriş isə ikinci
   * dərəcəlidir. `favorites` cədvəlinə `@@index([listingId])` əlavə olunub —
   * əks halda bu tərs axtarış seq scan olardı.
   */
  private async notifyFavoritesOfStatusChange(
    listingId: string,
    ownerId: string,
    title: string,
    status: ListingStatus,
  ): Promise<void> {
    try {
      const rows = await this.prisma.favorite.findMany({
        where: { listingId },
        select: { userId: true },
        take: 500,
      });

      const label = status === 'sold' ? 'satıldı' : 'artıq aktiv deyil';
      for (const row of rows) {
        if (row.userId === ownerId) continue;
        await this.notifications.create(
          row.userId,
          'listing_status',
          `Sevimlilərinizdəki «${title}» ${label}`,
          'Oxşar elanlara baxmaq üçün toxunun.',
          { listingId, status },
        );
      }
    } catch {
      // Bildiriş ikinci dərəcəlidir — status dəyişikliyi onsuz da yazılıb.
    }
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
    if (dto.categoryId !== undefined) {
      // `vertical` denormalizasiya sütunudur və yaratma anında kateqoriyadan
      // götürülür (yuxarıda create()). Redaktədə isə yalnız `categoryId` yazılırdı,
      // ona görə kateqoriya dəyişdirilən elan köhnə vertical-da ilişib qalırdı —
      // `?vertical=` filtri (findAll) və frontend-in vertical çipləri yanlış nəticə
      // verirdi. `assertExists` create yolundakı tanış naxışdır: mövcud olmayan
      // kateqoriya üçün Prisma FK 500-ü əvəzinə düzgün 4xx qaytarır.
      const category = await this.categories.assertExists(dto.categoryId);
      data.categoryId = dto.categoryId;
      data.vertical = category.vertical;
    }
    if (dto.districtId !== undefined) data.districtId = dto.districtId ?? null;
    // AŞAĞIDAKI SAHƏLƏR ƏVVƏL SƏSSİZCƏ ATILIRDI: UpdateListingDto = PartialType(CreateListingDto)
    // olduğu üçün whitelist-dən keçirdilər, lakin data blokuna köçürülmürdülər —
    // PATCH 200 qaytarır, dəyər isə dəyişmirdi. `?? null` semantikası `price` ilə
    // eynidir: açıq `null` göndərmək = sahəni təmizləmək.
    if (dto.currency !== undefined) data.currency = dto.currency;
    if (dto.oldPrice !== undefined) data.oldPrice = dto.oldPrice ?? null;
    if (dto.contactName !== undefined) data.contactName = dto.contactName ?? null;
    if (dto.contactPhone !== undefined) data.contactPhone = dto.contactPhone ?? null;
    if (dto.contactWhatsapp !== undefined) data.contactWhatsapp = dto.contactWhatsapp;
    if (dto.address !== undefined) data.address = dto.address ?? null;
    if (dto.lat !== undefined) data.lat = dto.lat ?? null;
    if (dto.lng !== undefined) data.lng = dto.lng ?? null;
    if (dto.hasDelivery !== undefined) data.hasDelivery = dto.hasDelivery;
    if (dto.hasCredit !== undefined) data.hasCredit = dto.hasCredit;
    if (dto.hasBarter !== undefined) data.hasBarter = dto.hasBarter;
    if (dto.hasWarranty !== undefined) data.hasWarranty = dto.hasWarranty;
    if (dto.inStock !== undefined) data.inStock = dto.inStock;
    // Redaktədə də eyni təmizləmə işləyir — əks halda yaratma yolunda bağlanan
    // qapı PATCH ilə açıq qalırdı.
    if (dto.attributes !== undefined) {
      const clean = await this.resolveAttributes(
        dto.categoryId ?? listing.categoryId,
        dto.attributes,
      );
      data.attributes = clean as Prisma.InputJsonValue;
    }

    // Şəkillər də əvvəl səssizcə atılırdı: istifadəçi redaktədə şəkli silir, «Yadda
    // saxla» 200 qaytarır, şəkil isə yerində qalırdı. Sahə + şəkil yazısı BİR
    // tranzaksiyadadır — deleteMany uğurlu, createMany uğursuz olsa elan şəkilsiz
    // qalardı. `!== undefined` yoxlaması kritikdir: PATCH qismidir, `images`
    // göndərilməyən sorğu (məs. yalnız qiymət dəyişikliyi) şəkillərə TOXUNMAMALIDIR.
    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.listing.update({ where: { id }, data });

      if (dto.images !== undefined) {
        await tx.listingImage.deleteMany({ where: { listingId: id } });
        if (dto.images.length) {
          await tx.listingImage.createMany({
            data: dto.images.map((img, i) => ({
              listingId: id,
              url: img.url,
              width: img.width ?? null,
              height: img.height ?? null,
              blurHash: img.blurHash ?? null,
              sortOrder: i, // sıra göndərilən massivin sırasıdır (create ilə eyni)
            })),
          });
        }
      }

      return tx.listing.findUniqueOrThrow({
        where: { id },
        // `take: 1` GÖTÜRÜLDÜ — mutasiya cavabı create/findById ilə eyni tamlıqda
        // olmalıdır (bax setStatus şərhi).
        include: { images: { orderBy: { sortOrder: 'asc' } }, category: { select: { nameAz: true, slug: true } }, district: { select: { nameAz: true, slug: true, region: { select: { nameAz: true, slug: true } } } } },
      });
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
      // FORMAT YOXLAMASI DB SORĞUSUNDAN ƏVVƏL: `?region=baki%00` kimi NUL baytlı və
      // ya yararsız slug Postgres-ə çatanda Prisma P2023 atırdı və istifadəçi
      // 500 görürdü. Belə dəyər heç bir regiona uyğun gələ bilmədiyi üçün
      // cavab «tapılmadı»dır — server xətası deyil.
      if (!isSafeSlug(q.region)) {
        throw new NotFoundException('Region tapılmadı');
      }
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

    /**
     * Ani keyword axtarış — DİAKRİTİKSİZ YAZILIŞI DA TAPIR.
     *
     * ÖLÇÜLMÜŞ DEFEKT: `?q=mənzil` 5 nəticə verirdi, `?q=menzil` isə 0.
     * Eyni cür `şəhər`→1, `seher`→0. Azərbaycan istifadəçilərinin böyük hissəsi
     * diakritikasız yazır (ə→e, ş→s, ç→c, ğ→g, ı→i, ö→o, ü→u), yəni axtarışın
     * mühüm hissəsi ölü idi.
     *
     * `az-text` modulu bunu bir yerdə həll edir: diakritik variantlar, İ/ı registr
     * xüsusiyyəti, LIKE metasimvollarının escape-i və atributlardakı brend/model
     * budaqları. Modul `SearchService`-in fallback yolu ilə ORTAQDIR — iki
     * axtarış yolunun bir-birindən sürüşməsi məhz belə defektlərin mənbəyi idi.
     *
     * DİQQƏT: `azKeywordOr` escape-i ÖZÜ edir — buradakı `escapeLike` bir daha
     * tətbiq edilməməlidir, əks halda `\` ikiqatlanar.
     *
     * 2 simvoldan qısa sorğuda (məs. «X») əvvəl filtr ÜMUMİYYƏTLƏ qurulmurdu və
     * istifadəçi bütün kataloqu «X üzrə 111 nəticə» kimi görürdü. İndi sorğunun
     * özü tək termin kimi tətbiq olunur.
     */
    if (q.q?.trim()) {
      const raw = q.q.trim();
      const words = azSearchWords(raw, 2, 6);
      const terms = words.length ? words : [raw];
      where.OR = terms.flatMap((w) => azKeywordOr(w));
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
        // Əvvəl səssizcə atılırdı və filtrsiz BÜTÜN kataloq qayıdırdı — istifadəçi
        // «filtr tətbiq olundu» sanırdı. Səssiz keçid həm də daxili ziddiyyət idi:
        // `sort=random` kimi yanlış parametr onsuz da 422 verir. Frontend `attrs`-i
        // həmişə JSON.stringify ilə göndərir, ona görə sayt trafiki təsirlənmir.
        throw new BadRequestException('attrs parametri düzgün JSON deyil');
      }
    }

    // SÜRƏTLİ FİLTRLƏR — ana səhifədəki çiplər.
    // Yalnız `true` tətbiq olunur: çip ya seçilib, ya yox. `false` üçün filtr
    // qurmaq «çatdırılması OLMAYANLAR» kimi gözlənilməz nəticə verərdi.
    if (q.hasDelivery === true) where.hasDelivery = true;
    if (q.vip === true) where.isVip = true;
    // `images: { some: {} }` — ən azı bir şəkli olan elanlar (əlaqə üzrə mövcudluq).
    if (q.withPhoto === true) where.images = { some: {} };
    // Təsdiqli satıcı = elanın bağlı olduğu MAĞAZA təsdiqlənib. Mağazasız elanlar
    // (fərdi satıcılar) bu filtrdə görünmür — «təsdiqli satıcı» nişanı məhz
    // mağaza yoxlamasından gəlir.
    if (q.verified === true) where.store = { isVerified: true };

    if (q.priceMin != null || q.priceMax != null) {
      // Tərs aralıq (priceMin > priceMax) əvvəl səssizcə 0 nəticə verirdi. 422 ATMIRIQ:
      // saxlanmış axtarışlar və paylaşılmış linklər birdən xəta səhifəsinə düşərdi —
      // əvəzinə hədləri yerbəyer edirik ki, istifadəçi gözlədiyi aralığı görsün.
      let lo = q.priceMin;
      let hi = q.priceMax;
      if (lo != null && hi != null && lo > hi) [lo, hi] = [hi, lo];

      const price: Prisma.DecimalNullableFilter = {};
      if (lo != null) price.gte = lo;
      if (hi != null) price.lte = hi;
      where.price = price;
    }

    // price nullable-dır ("razılaşma yolu ilə" elanlarda NULL). Postgres-in default davranışı
    // DESC üçün NULLS FIRST-dir — ona görə "Baha əvvəl" sıralaması qiymətsiz elanları başa atırdı.
    // nulls: 'last' hər iki istiqamətdə qiymətsizləri sona salır (ASC-də də açıq yazılır ki,
    // davranış DB default-undan asılı qalmasın). views/createdAt NOT NULL-dur — onlara lazım deyil.
    //
    // Sıralama HƏMİŞƏ unikal açarla (`id`) bitir: tək açarlı ORDER BY-da bərabər
    // dəyərlərin (eyni `views`, eyni qiymət) sırası Postgres üçün sərbəstdir, ona görə
    // LIMIT/OFFSET səhifələri arasında elanlar sürüşürdü — ölçüldü: sort=popular üzrə
    // 113 elandan 6-sı təkrarlanır, 6-sı isə heç bir səhifəyə düşmürdü.
    // Birinci meyar dəyişmir, yalnız bərabərlik halları sabitləşir.
    const orderBy: Prisma.ListingOrderByWithRelationInput[] =
      q.sort === 'price_asc'
        ? [{ price: { sort: 'asc', nulls: 'last' } }, { id: 'asc' }]
        : q.sort === 'price_desc'
          ? [{ price: { sort: 'desc', nulls: 'last' } }, { id: 'asc' }]
          : q.sort === 'popular'
            ? [{ views: 'desc' }, { createdAt: 'desc' }, { id: 'asc' }]
            : [{ createdAt: 'desc' }, { id: 'asc' }];

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
