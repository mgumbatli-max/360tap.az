import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { StoreStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  toListingResponse,
  type ListingResponse,
} from '../listings/dto/listing-response.dto';
import type { ListMeta } from '../listings/listings.service';
import { makeSlug } from '../listings/utils/slug.util';
import { SettingsService } from '../settings/settings.service';
import type { CreateStoreDto } from './dto/create-store.dto';
import type { QueryStoresDto } from './dto/query-stores.dto';
import type {
  CreateStoreBranchDto,
  UpdateStoreBranchDto,
} from './dto/store-branch.dto';
import type { UpdateStoreDto } from './dto/update-store.dto';
import { toWorkingHoursJson } from './dto/working-hours.dto';

const STORE_PUBLIC_SELECT = {
  id: true,
  slug: true,
  name: true,
  logoUrl: true,
  coverUrl: true,
  description: true,
  status: true,
  isVerified: true,
  source: true,
  rating: true,
  reviewsCount: true,
  phone: true,
  whatsapp: true,
  instagram: true,
  workingHours: true,
  deliveryTerms: true,
  warrantyTerms: true,
  createdAt: true,
} satisfies Prisma.StoreSelect;

/** Kataloq kartı — əlaqə məlumatları (telefon/WhatsApp) siyahıda lazım deyil. */
const STORE_CARD_SELECT = {
  id: true,
  slug: true,
  name: true,
  logoUrl: true,
  coverUrl: true,
  description: true,
  isVerified: true,
  rating: true,
  reviewsCount: true,
  createdAt: true,
} satisfies Prisma.StoreSelect;

const BRANCH_SELECT = {
  id: true,
  name: true,
  address: true,
  districtId: true,
  lat: true,
  lng: true,
  phone: true,
} satisfies Prisma.StoreBranchSelect;

/** `PATCH /me/store`-un toxuna bildiyi sahələr (audit «before» snapshot-u üçün). */
const EDITABLE_STORE_FIELDS = [
  'logoUrl',
  'coverUrl',
  'description',
  'phone',
  'whatsapp',
  'instagram',
  'workingHours',
  'deliveryTerms',
  'warrantyTerms',
] as const;

/** Audit sətrinin gövdəsi — JSON-a təhlükəsiz düşən düz dəyərlər. */
type AuditPayload = Record<string, unknown>;

/**
 * Audit/JSONB gövdəsini Prisma-nın JSON tipinə gətirir.
 * NİYƏ round-trip: `undefined` sahələr atılır və `Date` sətrə çevrilir —
 * əks halda JSONB-yə yarımçıq və ya serializasiya olunmayan dəyər düşərdi.
 */
function toJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value ?? null)) as Prisma.InputJsonValue;
}

@Injectable()
export class StoresService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: SettingsService,
  ) {}

  /** İstifadəçi üçün mağaza yaradır (hər istifadəçidə bir mağaza). */
  async create(ownerId: string, dto: CreateStoreDto, ip?: string) {
    const existing = await this.prisma.store.findUnique({
      where: { ownerId },
      select: { id: true },
    });
    if (existing) throw new ConflictException('Bu istifadəçinin artıq mağazası var');

    const slug = await this.uniqueSlug(dto.name);

    // QIRIQ HALQA 2: status heç yerdə YAZILMIRDI, ona görə hər mağaza sxem
    // defoltunda (`pending`) donub qalırdı və ictimai səhifədə heç vaxt
    // «aktiv» sayılmırdı. İndi qərarı `store.auto_approve` bayrağı verir:
    // açıqdırsa (defolt) mağaza dərhal işləyir — başlanğıc siyasəti heç kimi
    // bloklamamağı tələb edir; bağlıdırsa admin təsdiqi gözlənilir.
    const autoApprove = await this.settings.isEnabled('store.auto_approve');
    const status: StoreStatus = autoApprove ? 'active' : 'pending';

    try {
      return await this.prisma.$transaction(async (tx) => {
        const store = await tx.store.create({
          data: {
            ownerId,
            slug,
            name: dto.name,
            status,
            description: dto.description ?? null,
            phone: dto.phone ?? null,
            whatsapp: dto.whatsapp ?? null,
            instagram: dto.instagram ?? null,
          },
          select: STORE_PUBLIC_SELECT,
        });

        await tx.user.update({
          where: { id: ownerId },
          data: { sellerType: 'store', role: 'business' },
        });

        // Mağaza statusu moderasiya qərarıdır — kimin, nə vaxt, hansı rejimdə
        // (avto/əl ilə) aktivləşdirdiyi sonradan sübut oluna bilməlidir.
        await tx.auditLog.create({
          data: {
            actorId: ownerId,
            action: 'store.create',
            entity: 'store',
            entityId: store.id,
            after: toJson({ slug: store.slug, name: store.name, status, autoApprove }),
            ip: ip ?? null,
          },
        });

        return store;
      });
    } catch (e) {
      // Paralel yaratma yarışı: DB unique constraint → təmiz 409
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('Bu istifadəçinin artıq mağazası var');
      }
      throw e;
    }
  }

  // ============ Mağaza sahibi (JWT — IDOR-a bağlı) ============

  /**
   * Sorğu sahibinin mağazası.
   * IDOR MÜDAFİƏSİ: mağaza HƏMİŞƏ `ownerId` ilə tapılır; heç bir `/me/store*`
   * endpoint-i yol parametrindəki mağaza id-sinə güvənmir.
   */
  private async requireOwnStore(ownerId: string): Promise<{ id: string; status: StoreStatus }> {
    const store = await this.prisma.store.findUnique({
      where: { ownerId },
      select: { id: true, status: true },
    });
    if (!store) throw new NotFoundException('Mağazanız yoxdur — əvvəlcə POST /me/store');
    return store;
  }

  /** Sahibin öz mağazası — `pending`/`suspended` olsa da göstərilir (status daxil). */
  /**
   * «MƏNİM MAĞAZAM» — MAĞAZASI OLMAMAQ XƏTA DEYİL.
   *
   * ƏVVƏL: mağazası olmayan istifadəçi üçün 404 atılırdı. Nəticədə `/profil/magazam`
   * səhifəsi HƏR ADİ AÇILIŞDA brauzer konsoluna «Failed to load resource: 404»
   * yazırdı və şəbəkə panelində uğursuz sorğu görünürdü — halbuki bu, tam normal
   * vəziyyətdir: istifadəçi hələ mağaza açmayıb.
   *
   * «Varmı?» sualına «yoxdur» cavabı 200 + `null`-dır. 404 yalnız MÖVCUD OLMAYAN
   * resursa müraciətdə mənalıdır; burada resurs istifadəçinin özüdür və o mövcuddur.
   * Klient `data === null` halını «mağaza yarat» ekranı kimi göstərir.
   */
  async getMine(ownerId: string) {
    const store = await this.prisma.store.findUnique({
      where: { ownerId },
      select: STORE_PUBLIC_SELECT,
    });
    if (!store) return null;

    const [activeListings, totalListings, branches] = await this.prisma.$transaction([
      this.prisma.listing.count({ where: { storeId: store.id, status: 'active' } }),
      this.prisma.listing.count({ where: { storeId: store.id } }),
      this.prisma.storeBranch.count({ where: { storeId: store.id } }),
    ]);

    return { ...store, activeListings, totalListings, branches };
  }

  /**
   * QIRIQ HALQA 4: `logoUrl/coverUrl/workingHours/deliveryTerms/warrantyTerms`
   * modeldə vardı, amma onları yazan endpoint YOX idi — mağaza profili əbədi
   * yarımçıq qalırdı.
   *
   * `undefined` = toxunma, `null` = sil (DTO şərhinə bax).
   */
  async updateMine(ownerId: string, dto: UpdateStoreDto, ip?: string) {
    const current = await this.prisma.store.findUnique({
      where: { ownerId },
      select: {
        id: true,
        logoUrl: true,
        coverUrl: true,
        description: true,
        phone: true,
        whatsapp: true,
        instagram: true,
        workingHours: true,
        deliveryTerms: true,
        warrantyTerms: true,
      },
    });
    if (!current) throw new NotFoundException('Mağazanız yoxdur — əvvəlcə POST /me/store');

    const data: Prisma.StoreUpdateInput = {};
    const patch: AuditPayload = {};

    if (dto.logoUrl !== undefined) {
      data.logoUrl = dto.logoUrl;
      patch.logoUrl = dto.logoUrl;
    }
    if (dto.coverUrl !== undefined) {
      data.coverUrl = dto.coverUrl;
      patch.coverUrl = dto.coverUrl;
    }
    if (dto.description !== undefined) {
      data.description = dto.description;
      patch.description = dto.description;
    }
    if (dto.phone !== undefined) {
      data.phone = dto.phone;
      patch.phone = dto.phone;
    }
    if (dto.whatsapp !== undefined) {
      data.whatsapp = dto.whatsapp;
      patch.whatsapp = dto.whatsapp;
    }
    if (dto.instagram !== undefined) {
      data.instagram = dto.instagram;
      patch.instagram = dto.instagram;
    }
    if (dto.deliveryTerms !== undefined) {
      data.deliveryTerms = dto.deliveryTerms;
      patch.deliveryTerms = dto.deliveryTerms;
    }
    if (dto.warrantyTerms !== undefined) {
      data.warrantyTerms = dto.warrantyTerms;
      patch.warrantyTerms = dto.warrantyTerms;
    }

    if (dto.workingHours !== undefined) {
      // Nullable JSON sütununu SİLMƏK üçün Prisma `DbNull` tələb edir — sadə `null`
      // TypeScript səviyyəsində qəbul olunmur (JSON `null` ilə DB NULL fərqlidir).
      const hours = dto.workingHours === null ? null : toWorkingHoursJson(dto.workingHours);
      data.workingHours = hours === null ? Prisma.DbNull : toJson(hours);
      patch.workingHours = hours;
    }

    if (Object.keys(data).length === 0) {
      throw new BadRequestException('Dəyişdiriləcək sahə göndərilməyib');
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.store.update({
        where: { id: current.id },
        data,
        select: STORE_PUBLIC_SELECT,
      });

      // Yalnız DƏYİŞƏN sahələrin əvvəlki dəyəri yazılır — audit sətri profilin
      // tam surətinə çevrilməsin, amma geri dönüş üçün kifayət etsin.
      const before: AuditPayload = {};
      for (const field of EDITABLE_STORE_FIELDS) {
        if (field in patch) before[field] = current[field];
      }
      await tx.auditLog.create({
        data: {
          actorId: ownerId,
          action: 'store.update',
          entity: 'store',
          entityId: current.id,
          before: toJson(before),
          after: toJson(patch),
          ip: ip ?? null,
        },
      });

      return updated;
    });
  }

  // ============ Filiallar ============

  async listBranches(ownerId: string) {
    const store = await this.requireOwnStore(ownerId);
    return this.prisma.storeBranch.findMany({
      where: { storeId: store.id },
      orderBy: { name: 'asc' },
      select: BRANCH_SELECT,
    });
  }

  async createBranch(ownerId: string, dto: CreateStoreBranchDto, ip?: string) {
    const store = await this.requireOwnStore(ownerId);
    await this.assertDistrictExists(dto.districtId);

    return this.prisma.$transaction(async (tx) => {
      const branch = await tx.storeBranch.create({
        data: {
          storeId: store.id,
          name: dto.name,
          address: dto.address,
          districtId: dto.districtId ?? null,
          lat: dto.lat ?? null,
          lng: dto.lng ?? null,
          phone: dto.phone ?? null,
        },
        select: BRANCH_SELECT,
      });
      await tx.auditLog.create({
        data: {
          actorId: ownerId,
          action: 'store_branch.create',
          entity: 'store_branch',
          entityId: branch.id,
          after: toJson({ storeId: store.id, name: branch.name, address: branch.address }),
          ip: ip ?? null,
        },
      });
      return branch;
    });
  }

  async updateBranch(ownerId: string, branchId: string, dto: UpdateStoreBranchDto, ip?: string) {
    const store = await this.requireOwnStore(ownerId);
    // IDOR: filial yalnız SAHİBİN mağazasına aid olduqda tapılır. `id`-yə görə
    // ayrıca oxuyub sonra müqayisə etmək eyni nəticəni verir, amma bu forma
    // yoxlamanı unutmağa imkan qoymur.
    const current = await this.prisma.storeBranch.findFirst({
      where: { id: branchId, storeId: store.id },
      select: BRANCH_SELECT,
    });
    if (!current) throw new NotFoundException('Filial tapılmadı');

    if (dto.districtId) await this.assertDistrictExists(dto.districtId);

    const data: Prisma.StoreBranchUpdateInput = {};
    const patch: AuditPayload = {};
    if (dto.name !== undefined) {
      data.name = dto.name;
      patch.name = dto.name;
    }
    if (dto.address !== undefined) {
      data.address = dto.address;
      patch.address = dto.address;
    }
    if (dto.districtId !== undefined) {
      data.districtId = dto.districtId;
      patch.districtId = dto.districtId;
    }
    if (dto.lat !== undefined) {
      data.lat = dto.lat;
      patch.lat = dto.lat;
    }
    if (dto.lng !== undefined) {
      data.lng = dto.lng;
      patch.lng = dto.lng;
    }
    if (dto.phone !== undefined) {
      data.phone = dto.phone;
      patch.phone = dto.phone;
    }

    if (Object.keys(data).length === 0) {
      throw new BadRequestException('Dəyişdiriləcək sahə göndərilməyib');
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.storeBranch.update({
        where: { id: branchId },
        data,
        select: BRANCH_SELECT,
      });
      await tx.auditLog.create({
        data: {
          actorId: ownerId,
          action: 'store_branch.update',
          entity: 'store_branch',
          entityId: branchId,
          before: toJson(current),
          after: toJson(patch),
          ip: ip ?? null,
        },
      });
      return updated;
    });
  }

  async deleteBranch(ownerId: string, branchId: string, ip?: string): Promise<{ deleted: true }> {
    const store = await this.requireOwnStore(ownerId);
    const current = await this.prisma.storeBranch.findFirst({
      where: { id: branchId, storeId: store.id },
      select: BRANCH_SELECT,
    });
    if (!current) throw new NotFoundException('Filial tapılmadı');

    await this.prisma.$transaction(async (tx) => {
      await tx.storeBranch.delete({ where: { id: branchId } });
      await tx.auditLog.create({
        data: {
          actorId: ownerId,
          action: 'store_branch.delete',
          entity: 'store_branch',
          entityId: branchId,
          before: toJson(current),
          ip: ip ?? null,
        },
      });
    });
    return { deleted: true };
  }

  // ============ İctimai ============

  /**
   * Mağaza kataloqu — YALNIZ `active`.
   * `pending` (təsdiq gözləyən) və `suspended` (dayandırılmış) mağaza ictimai
   * siyahıda görünməməlidir.
   */
  async findAll(q: QueryStoresDto) {
    const page = q.page ?? 1;
    const limit = Math.min(q.limit ?? 20, 50);

    const where: Prisma.StoreWhereInput = { status: 'active' };
    if (q.q) where.name = { contains: q.q, mode: 'insensitive' };
    if (q.verified !== undefined) where.isVerified = q.verified;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.store.findMany({
        where,
        // Təsdiqlənmişlər öndə, sonra yenilər. Reytinq hələ 0-dır (rəy yoxdur),
        // ona görə sıralama meyarı kimi istifadə edilmir — uydurma sıra yaradar.
        orderBy: [{ isVerified: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
        select: {
          ...STORE_CARD_SELECT,
          // Filtrli əlaqə sayğacı: N+1 sorğu olmadan aktiv elan sayı.
          _count: { select: { listings: { where: { status: 'active' } } } },
        },
      }),
      this.prisma.store.count({ where }),
    ]);

    return {
      data: items.map(({ _count, ...store }) => ({ ...store, activeListings: _count.listings })),
      meta: { page, limit, total, hasMore: page * limit < total },
    };
  }

  /** Public mağaza profili + aktiv elan sayı. Yalnız `active` mağaza. */
  async getBySlug(slug: string) {
    const store = await this.prisma.store.findFirst({
      where: { slug, status: 'active' },
      select: STORE_PUBLIC_SELECT,
    });
    // Qəsdən 404 (403 deyil): `pending`/`suspended` mağazanın mövcudluğu belə
    // kənar şəxsə açıqlanmamalıdır.
    if (!store) throw new NotFoundException('Mağaza tapılmadı');

    const [activeListings, branches] = await this.prisma.$transaction([
      this.prisma.listing.count({ where: { storeId: store.id, status: 'active' } }),
      this.prisma.storeBranch.findMany({
        where: { storeId: store.id },
        orderBy: { name: 'asc' },
        select: BRANCH_SELECT,
      }),
    ]);
    return { ...store, activeListings, branches };
  }

  /** Mağazanın aktiv elanları (paginated). Yalnız `active` mağaza. */
  async getListings(
    slug: string,
    q: { page?: number; limit?: number },
  ): Promise<{ data: ListingResponse[]; meta: ListMeta }> {
    const store = await this.prisma.store.findFirst({
      where: { slug, status: 'active' },
      select: { id: true },
    });
    if (!store) throw new NotFoundException('Mağaza tapılmadı');

    const page = q.page ?? 1;
    const limit = Math.min(q.limit ?? 20, 50);
    const where: Prisma.ListingWhereInput = { storeId: store.id, status: 'active' };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.listing.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { images: { orderBy: { sortOrder: 'asc' }, take: 1 } },
      }),
      this.prisma.listing.count({ where }),
    ]);

    return {
      data: items.map(toListingResponse),
      meta: { page, limit, total, hasMore: page * limit < total },
    };
  }

  // ============ Köməkçilər ============

  /** Rayon id-si göndərilibsə mövcudluğu yoxlanılır (FK xətası 500 verməsin). */
  private async assertDistrictExists(districtId?: string | null): Promise<void> {
    if (!districtId) return;
    const district = await this.prisma.district.findUnique({
      where: { id: districtId },
      select: { id: true },
    });
    if (!district) throw new BadRequestException('Rayon tapılmadı');
  }

  private async uniqueSlug(name: string): Promise<string> {
    const base = makeSlug(name) || 'magaza';
    let slug = base;
    let i = 1;
    while (
      await this.prisma.store.findUnique({ where: { slug }, select: { id: true } })
    ) {
      slug = `${base}-${i++}`;
    }
    return slug;
  }
}
