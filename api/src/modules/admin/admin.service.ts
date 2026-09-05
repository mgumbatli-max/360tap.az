import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, type UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { SETTING_DEFS, SettingsService } from '../settings/settings.service';
import { AuditService } from './audit.service';
import type { QueryStoresDto } from './dto/query-stores.dto';
import type { QueryUsersDto } from './dto/query-users.dto';
import type { UpdateStoreAdminDto } from './dto/update-store.dto';
import type { UpdateUserAdminDto } from './dto/update-user.dto';
import type { UpsertCategoryLimitDto } from './dto/upsert-category-limit.dto';

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

/** Admin siyahılarında istifadəçinin QAYTARILA BİLƏN sahələri. */
const USER_SAFE_SELECT = {
  id: true,
  email: true,
  phone: true,
  fullName: true,
  avatarUrl: true,
  role: true,
  status: true,
  sellerType: true,
  isPhoneVerified: true,
  isEmailVerified: true,
  lastLoginAt: true,
  createdAt: true,
} satisfies Prisma.UserSelect;
// ⚠️ `passwordHash` və `refreshTokens` QƏSDƏN YOXDUR: admin panelinə düşən hər
// sahə brauzer keşinə, loglara və ekran görüntülərinə düşür. Sirr oraya çıxmamalıdır.

const STORE_ADMIN_SELECT = {
  id: true,
  slug: true,
  name: true,
  logoUrl: true,
  status: true,
  isVerified: true,
  source: true,
  rating: true,
  reviewsCount: true,
  phone: true,
  createdAt: true,
  owner: { select: { id: true, fullName: true, email: true, phone: true, role: true } },
  _count: { select: { listings: true } },
} satisfies Prisma.StoreSelect;

type StoreRow = Prisma.StoreGetPayload<{ select: typeof STORE_ADMIN_SELECT }>;

function paginate(q: { page?: number; limit?: number }): { page: number; limit: number; skip: number } {
  const page = q.page ?? 1;
  const limit = Math.min(q.limit ?? 20, 50);
  return { page, limit, skip: (page - 1) * limit };
}

/** Prisma `Decimal` JSON-da sətir kimi çıxır — admin paneli rəqəmlə işləyir. */
function decimalToNumber(value: Prisma.Decimal): number {
  return Number(value.toString());
}

function storeToResponse(s: StoreRow) {
  const { _count, rating, ...rest } = s;
  return { ...rest, rating: decimalToNumber(rating), listingsCount: _count.listings };
}

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: SettingsService,
    private readonly audit: AuditService,
  ) {}

  // ═══════════════════════════ AYARLAR ═══════════════════════════

  /** Bütün bilinən bayraqlar + cari dəyər (SETTING_DEFS siyahısı ilə məhdudlaşır). */
  async listSettings() {
    return this.settings.all();
  }

  /**
   * Monetizasiyanın ana açarı. Dəyər tipi açarın DEFOLTU ilə tutuşdurulur ki,
   * `{"value":"true"}` kimi sətir boolean bayrağa düşməsin (sətir həmişə truthy-dir,
   * yəni belə bir səhv bayrağı SƏSSİZCƏ açıq vəziyyətdə qıfıllayardı).
   */
  async updateSetting(key: string, value: unknown, actorId: string, ip?: string) {
    const def = SETTING_DEFS.find((d) => d.key === key);
    if (!def) throw new NotFoundException(`Naməlum ayar açarı: ${key}`);
    if (typeof value !== typeof def.default) {
      throw new BadRequestException(
        `«${key}» üçün dəyər ${typeof def.default} tipində olmalıdır (gələn: ${typeof value})`,
      );
    }

    const before = (await this.settings.all()).find((s) => s.key === key)?.value ?? def.default;
    await this.settings.set(key, value, actorId);

    // NİYƏ tranzaksiyasız: `set()` öz upsert-ini artıq icra edib və keşi təmizləyib.
    // Audit yazısı uğursuz olsa belə ayarı geri qaytarmaq daha təhlükəlidir —
    // operator düyməni basıb, nəticə isə ondan gizlədilərdi.
    await this.audit.record({
      actorId,
      action: 'setting.update',
      entity: 'setting',
      entityId: key,
      before: { value: before as Prisma.InputJsonValue },
      after: { value: value as Prisma.InputJsonValue },
      ip,
    });

    return { key, value, label: def.label, hint: def.hint };
  }

  // ═══════════════════════════ MAĞAZALAR ═══════════════════════════

  async listStores(q: QueryStoresDto): Promise<{ data: ReturnType<typeof storeToResponse>[]; meta: PageMeta }> {
    const { page, limit, skip } = paginate(q);

    const where: Prisma.StoreWhereInput = {};
    if (q.status) where.status = q.status;
    if (q.verified !== undefined) where.isVerified = q.verified === 'true';
    if (q.q) {
      where.OR = [
        { name: { contains: q.q, mode: 'insensitive' } },
        { slug: { contains: q.q, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.store.findMany({
        where,
        select: STORE_ADMIN_SELECT,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.store.count({ where }),
    ]);

    return {
      data: items.map(storeToResponse),
      meta: { page, limit, total, hasMore: page * limit < total },
    };
  }

  /**
   * Mağazanın təsdiqi / verifikasiyası / dayandırılması.
   * Audit qeydi dəyişikliklə EYNİ tranzaksiyadadır — jurnalda olmayan dəyişiklik
   * (və ya baş verməmiş dəyişikliyin jurnalı) qalmasın.
   */
  async updateStore(id: string, dto: UpdateStoreAdminDto, actorId: string, ip?: string) {
    if (dto.status === undefined && dto.isVerified === undefined) {
      throw new BadRequestException('Dəyişdiriləcək sahə göstərilməyib');
    }

    const before = await this.prisma.store.findUnique({
      where: { id },
      select: { id: true, status: true, isVerified: true },
    });
    if (!before) throw new NotFoundException('Mağaza tapılmadı');

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.store.update({
        where: { id },
        data: {
          ...(dto.status !== undefined ? { status: dto.status } : {}),
          ...(dto.isVerified !== undefined ? { isVerified: dto.isVerified } : {}),
        },
        select: STORE_ADMIN_SELECT,
      });

      await this.audit.record(
        {
          actorId,
          action: 'store.update',
          entity: 'store',
          entityId: id,
          before: { status: before.status, isVerified: before.isVerified },
          after: { status: updated.status, isVerified: updated.isVerified },
          ip,
        },
        tx,
      );

      return storeToResponse(updated);
    });
  }

  // ═══════════════════════════ İSTİFADƏÇİLƏR ═══════════════════════════

  async listUsers(q: QueryUsersDto) {
    const { page, limit, skip } = paginate(q);

    const where: Prisma.UserWhereInput = {};
    if (q.role) where.role = q.role;
    if (q.status) where.status = q.status;
    if (q.q) {
      where.OR = [
        { fullName: { contains: q.q, mode: 'insensitive' } },
        { email: { contains: q.q, mode: 'insensitive' } },
        { phone: { contains: q.q } },
      ];
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        select: { ...USER_SAFE_SELECT, store: { select: { id: true, slug: true, status: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return { data: items, meta: { page, limit, total, hasMore: page * limit < total } };
  }

  /**
   * ÖZÜNÜ KİLİDLƏMƏ MÜDAFİƏSİ — bu metodun ən vacib hissəsi.
   * Üç ayrı deşik bağlanır:
   *  1) admin öz rolunu/statusunu dəyişə bilməz (səhvən özünü çıxarmaq geri dönməzdir);
   *  2) `admin` nə `super_admin` təyin edə, nə də `super_admin`-ə toxuna bilər
   *     (əks halda `admin` özünə səlahiyyət artıra bilərdi);
   *  3) sonuncu AKTİV `super_admin` nə aşağı salına, nə də deaktiv edilə bilər —
   *     yoxsa platforma sahibsiz qalır və bərpa yalnız SQL ilə mümkün olur.
   */
  async updateUser(
    id: string,
    dto: UpdateUserAdminDto,
    actor: { id: string; role: UserRole },
    ip?: string,
  ) {
    if (dto.role === undefined && dto.status === undefined) {
      throw new BadRequestException('Dəyişdiriləcək sahə göstərilməyib');
    }
    if (id === actor.id) {
      throw new ForbiddenException('Öz rolunuzu və ya statusunuzu dəyişə bilməzsiniz');
    }

    const before = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true, status: true },
    });
    if (!before) throw new NotFoundException('İstifadəçi tapılmadı');

    const touchesSuperAdmin = before.role === 'super_admin' || dto.role === 'super_admin';
    if (touchesSuperAdmin && actor.role !== 'super_admin') {
      throw new ForbiddenException('super_admin səlahiyyəti yalnız super_admin tərəfindən idarə olunur');
    }

    const losesSuperAdmin =
      before.role === 'super_admin' &&
      ((dto.role !== undefined && dto.role !== 'super_admin') ||
        (dto.status !== undefined && dto.status !== 'active'));
    if (losesSuperAdmin) {
      const remaining = await this.prisma.user.count({
        where: { role: 'super_admin', status: 'active', id: { not: id } },
      });
      if (remaining === 0) {
        throw new ForbiddenException(
          'Sonuncu aktiv super_admin çıxarıla bilməz — əvvəlcə başqa super_admin təyin edin',
        );
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id },
        data: {
          ...(dto.role !== undefined ? { role: dto.role } : {}),
          ...(dto.status !== undefined ? { status: dto.status } : {}),
        },
        select: USER_SAFE_SELECT,
      });

      await this.audit.record(
        {
          actorId: actor.id,
          action: dto.role !== undefined ? 'user.role_change' : 'user.status_change',
          entity: 'user',
          entityId: id,
          before: { role: before.role, status: before.status },
          after: { role: updated.role, status: updated.status },
          ip,
        },
        tx,
      );

      return updated;
    });
  }

  // ═══════════════════════════ KATEQORİYA LİMİTLƏRİ ═══════════════════════════

  /**
   * Bütün kateqoriyalar + (varsa) limit sətri.
   * NİYƏ hamısı: operator limiti hansı kateqoriyaya QOYMADIĞINI də görməlidir —
   * yalnız konfiqurasiya olunmuşları göstərsək, boşluqlar gözdən qaçır.
   * `enforced` sahəsi dürüstlük üçündür: bayraq bağlıdırsa limit YAZILIR, amma
   * heç kimi bloklamır — panel bunu açıq göstərməlidir.
   */
  async listCategoryLimits() {
    const [categories, enforced] = await Promise.all([
      this.prisma.category.findMany({
        select: {
          id: true,
          parentId: true,
          slug: true,
          nameAz: true,
          vertical: true,
          isActive: true,
          listingsCount: true,
          limit: {
            select: {
              freePerMonth: true,
              storeFreePerMonth: true,
              extraListingPrice: true,
              enabled: true,
              updatedAt: true,
            },
          },
        },
        orderBy: [{ vertical: 'asc' }, { sortOrder: 'asc' }, { nameAz: 'asc' }],
      }),
      this.settings.isMonetizedFeatureEnabled('listing_limits.enabled'),
    ]);

    return {
      data: categories.map((c) => ({
        ...c,
        limit: c.limit
          ? { ...c.limit, extraListingPrice: decimalToNumber(c.limit.extraListingPrice) }
          : null,
      })),
      meta: { enforced, total: categories.length },
    };
  }

  async upsertCategoryLimit(
    categoryId: string,
    dto: UpsertCategoryLimitDto,
    actorId: string,
    ip?: string,
  ) {
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
      select: { id: true, nameAz: true },
    });
    if (!category) throw new NotFoundException('Kateqoriya tapılmadı');

    const before = await this.prisma.categoryLimit.findUnique({ where: { categoryId } });

    const data = {
      freePerMonth: dto.freePerMonth,
      storeFreePerMonth: dto.storeFreePerMonth ?? null,
      extraListingPrice: new Prisma.Decimal(dto.extraListingPrice),
      enabled: dto.enabled,
    };

    return this.prisma.$transaction(async (tx) => {
      const row = await tx.categoryLimit.upsert({
        where: { categoryId },
        create: { categoryId, ...data },
        update: data,
      });

      await this.audit.record(
        {
          actorId,
          action: before ? 'category_limit.update' : 'category_limit.create',
          entity: 'category_limit',
          entityId: categoryId,
          before: before
            ? {
                freePerMonth: before.freePerMonth,
                storeFreePerMonth: before.storeFreePerMonth,
                extraListingPrice: decimalToNumber(before.extraListingPrice),
                enabled: before.enabled,
              }
            : undefined,
          after: {
            freePerMonth: row.freePerMonth,
            storeFreePerMonth: row.storeFreePerMonth,
            extraListingPrice: decimalToNumber(row.extraListingPrice),
            enabled: row.enabled,
          },
          ip,
        },
        tx,
      );

      return {
        categoryId: row.categoryId,
        categoryName: category.nameAz,
        freePerMonth: row.freePerMonth,
        storeFreePerMonth: row.storeFreePerMonth,
        extraListingPrice: decimalToNumber(row.extraListingPrice),
        enabled: row.enabled,
        updatedAt: row.updatedAt,
      };
    });
  }
}
