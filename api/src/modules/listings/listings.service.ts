import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { ListingStatus } from '@prisma/client';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CategoriesService } from '../categories/categories.service';
import type { CreateListingDto } from './dto/create-listing.dto';
import { toListingResponse, type ListingResponse } from './dto/listing-response.dto';
import type { QueryListingsDto } from './dto/query-listings.dto';
import { uniqueSlug } from './utils/slug.util';
import { SearchService } from '../../search/search.service';

const LISTING_TTL_DAYS = 30;

export interface ListMeta {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
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

@Injectable()
export class ListingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly categories: CategoriesService,
    private readonly search: SearchService,
  ) {}

  /**
   * Yeni elan yaradır.
   * Status: 'review' (moderasiya növbəsinə düşür).
   * Müddət: 30 gün.
   */
  async create(ownerId: string, dto: CreateListingDto): Promise<ListingResponse> {
    // 1. Kateqoriya doğrulaması (vertical-ı da qaytarır)
    const category = await this.categories.assertExists(dto.categoryId);

    // 2. Atribut sxemini yoxla (varsa)
    if (dto.attributes) {
      await this.validateAttributes(dto.categoryId, dto.attributes);
    }

    // 3. Rayon yoxla (varsa)
    if (dto.districtId) {
      const district = await this.prisma.district.findUnique({
        where: { id: dto.districtId },
        select: { id: true },
      });
      if (!district) throw new BadRequestException('Rayon tapılmadı');
    }

    // 4. Slug yarat
    const slug = uniqueSlug(dto.title);
    const expiresAt = new Date(Date.now() + LISTING_TTL_DAYS * 24 * 60 * 60 * 1000);

    // 5. Tranzaksiya: elan + şəkillər
    const created = await this.prisma.$transaction(async (tx) => {
      const listing = await tx.listing.create({
        data: {
          ownerId,
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
          attributes: (dto.attributes ?? {}) as Prisma.InputJsonValue,
          hasDelivery: dto.hasDelivery ?? false,
          hasCredit: dto.hasCredit ?? false,
          hasBarter: dto.hasBarter ?? false,
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
   * Atributların kateqoriyaya uyğunluğunu yoxlayır:
   * - required atributlar dolduruldumu?
   * - select / multiselect üçün dəyər icazəli seçimlərdəndirmi?
   * - number üçün rəqəmdir?
   * - boolean üçün boolean-dur?
   */
  private async validateAttributes(
    categoryId: string,
    attributes: Record<string, unknown>,
  ): Promise<void> {
    const schema = await this.prisma.categoryAttribute.findMany({
      where: { categoryId },
      select: { key: true, type: true, options: true, isRequired: true, labelAz: true },
    });

    for (const attr of schema) {
      const value = attributes[attr.key];

      if (attr.isRequired && (value === undefined || value === null || value === '')) {
        throw new BadRequestException(`'${attr.labelAz}' sahəsi məcburidir`);
      }
      if (value === undefined || value === null) continue;

      switch (attr.type) {
        case 'number':
          if (typeof value !== 'number' || Number.isNaN(value)) {
            throw new BadRequestException(`'${attr.labelAz}' rəqəm olmalıdır`);
          }
          break;
        case 'boolean':
          if (typeof value !== 'boolean') {
            throw new BadRequestException(`'${attr.labelAz}' true/false olmalıdır`);
          }
          break;
        case 'select': {
          const choices = optionValues(attr.options);
          if (typeof value !== 'string' || (choices.length > 0 && !choices.includes(value))) {
            throw new BadRequestException(
              `'${attr.labelAz}' bu siyahıdan birini seçməlisiniz: ${choices.join(', ')}`,
            );
          }
          break;
        }
        case 'multiselect': {
          if (!Array.isArray(value)) {
            throw new BadRequestException(`'${attr.labelAz}' massiv olmalıdır`);
          }
          const choices = optionValues(attr.options);
          for (const v of value) {
            if (typeof v !== 'string' || (choices.length > 0 && !choices.includes(v))) {
              throw new BadRequestException(
                `'${attr.labelAz}' düzgün seçim deyil: ${String(v)}`,
              );
            }
          }
          break;
        }
        case 'string':
          if (typeof value !== 'string') {
            throw new BadRequestException(`'${attr.labelAz}' mətn olmalıdır`);
          }
          break;
        case 'range':
          if (typeof value !== 'number') {
            throw new BadRequestException(`'${attr.labelAz}' rəqəm olmalıdır`);
          }
          break;
        case 'date':
          if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) {
            throw new BadRequestException(`'${attr.labelAz}' düzgün tarix olmalıdır (ISO)`);
          }
          break;
        case 'location':
          if (
            typeof value !== 'object' ||
            value === null ||
            typeof (value as { lat?: unknown }).lat !== 'number' ||
            typeof (value as { lng?: unknown }).lng !== 'number'
          ) {
            throw new BadRequestException(`'${attr.labelAz}' { lat, lng } strukturunda olmalıdır`);
          }
          break;
        default:
          throw new BadRequestException(`'${attr.labelAz}' üçün naməlum atribut tipi`);
      }
    }
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
      select: { ownerId: true },
    });
    if (!listing) throw new NotFoundException('Elan tapılmadı');
    if (listing.ownerId !== ownerId) throw new ForbiddenException('Bu elan sizə aid deyil');

    const data: Prisma.ListingUncheckedUpdateInput = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.price !== undefined) data.price = dto.price ?? null;
    if (dto.priceType !== undefined) data.priceType = dto.priceType;
    if (dto.condition !== undefined) data.condition = dto.condition;
    if (dto.categoryId !== undefined) data.categoryId = dto.categoryId;
    if (dto.districtId !== undefined) data.districtId = dto.districtId ?? null;
    if (dto.attributes !== undefined) data.attributes = dto.attributes as Prisma.InputJsonValue;

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

    if (q.category) {
      const cat = await this.prisma.category.findUnique({
        where: { slug: q.category },
        select: { id: true, children: { select: { id: true } } },
      });
      where.categoryId = cat
        ? { in: [cat.id, ...cat.children.map((c) => c.id)] }
        : { in: [] };
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

    const orderBy: Prisma.ListingOrderByWithRelationInput =
      q.sort === 'price_asc'
        ? { price: 'asc' }
        : q.sort === 'price_desc'
          ? { price: 'desc' }
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
      meta: { page, limit, total, hasMore: page * limit < total },
    };
  }
}
