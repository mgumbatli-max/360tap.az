import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';
import { AuditService } from './audit.service';
import {
  toAdminPackageResponse,
  toPackageResponse,
  type AdminPackageResponse,
  type PackageResponse,
} from './dto/billing-response.dto';
import type { CreatePackageDto } from './dto/create-package.dto';
import type { UpdatePackageDto } from './dto/update-package.dto';

/** Vitrində sıra: admin sortOrder ilə idarə edir, bərabərlikdə ucuzdan bahaya. */
const SHOWCASE_ORDER: Prisma.PackageOrderByWithRelationInput[] = [
  { sortOrder: 'asc' },
  { priceMonthly: 'asc' },
  { createdAt: 'asc' },
];

@Injectable()
export class PackagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: SettingsService,
    private readonly audit: AuditService,
  ) {}

  /**
   * İCTİMAİ VİTRİN.
   *
   * NİYƏ BOŞ MASSİV, XƏTA YOX: bayraq bağlı olduqda paket satışı sadəcə MÖVCUD
   * DEYİL — bu, səhv vəziyyət deyil, məhsul qərarıdır. 403/503 qaytarsaq, frontend
   * xəta ekranı göstərməli olardı; boş siyahı isə bölməni təbii şəkildə gizlədir.
   * Bayraq açılan an eyni endpoint dolu siyahı qaytarır, frontend dəyişmir.
   *
   * İkiqat şərt (`isMonetizedFeatureEnabled`): ümumi `monetization.enabled`
   * bağlıdırsa `packages.enabled` açıq olsa belə vitrin gizli qalır.
   */
  async listPublic(): Promise<PackageResponse[]> {
    if (!(await this.settings.isMonetizedFeatureEnabled('packages.enabled'))) return [];

    const packages = await this.prisma.package.findMany({
      where: { isActive: true },
      orderBy: SHOWCASE_ORDER,
    });
    return packages.map(toPackageResponse);
  }

  /** Admin siyahısı — deaktiv paketlər də görünür, satılmış abunə sayı ilə. */
  async listAdmin(): Promise<AdminPackageResponse[]> {
    const packages = await this.prisma.package.findMany({
      orderBy: SHOWCASE_ORDER,
      include: { _count: { select: { subscriptions: true } } },
    });
    return packages.map(toAdminPackageResponse);
  }

  async create(
    dto: CreatePackageDto,
    actor: { id: string; ip: string | null },
  ): Promise<AdminPackageResponse> {
    try {
      const created = await this.prisma.$transaction(async (tx) => {
        const pkg = await tx.package.create({
          data: {
            code: dto.code,
            name: dto.name,
            priceMonthly: dto.priceMonthly,
            durationDays: dto.durationDays ?? 30,
            serviceBalance: dto.serviceBalance ?? 0,
            listingQuota: dto.listingQuota ?? 0,
            discountPercent: dto.discountPercent ?? 0,
            description: dto.description ?? null,
            isActive: dto.isActive ?? false,
            sortOrder: dto.sortOrder ?? 0,
            limits: (dto.limits ?? {}) as Prisma.InputJsonValue,
            features: (dto.features ?? {}) as Prisma.InputJsonValue,
          },
        });
        const response = toAdminPackageResponse(pkg);
        await this.audit.log(
          {
            actorId: actor.id,
            action: 'package.create',
            entity: 'Package',
            entityId: pkg.id,
            after: response,
            ip: actor.ip,
          },
          tx,
        );
        return response;
      });
      return created;
    } catch (e) {
      throw this.mapCodeConflict(e);
    }
  }

  async update(
    id: string,
    dto: UpdatePackageDto,
    actor: { id: string; ip: string | null },
  ): Promise<AdminPackageResponse> {
    const existing = await this.prisma.package.findUnique({
      where: { id },
      include: { _count: { select: { subscriptions: true } } },
    });
    if (!existing) throw new NotFoundException('Paket tapılmadı');

    // PATCH semantikası: yalnız GÖNDƏRİLƏN sahələr dəyişir. `undefined` Prisma
    // üçün «toxunma» deməkdir, ona görə sahələr şərtsiz ötürülür.
    const data: Prisma.PackageUpdateInput = {
      code: dto.code,
      name: dto.name,
      priceMonthly: dto.priceMonthly,
      durationDays: dto.durationDays,
      serviceBalance: dto.serviceBalance,
      listingQuota: dto.listingQuota,
      discountPercent: dto.discountPercent,
      description: dto.description,
      isActive: dto.isActive,
      sortOrder: dto.sortOrder,
      limits: dto.limits as Prisma.InputJsonValue | undefined,
      features: dto.features as Prisma.InputJsonValue | undefined,
    };

    try {
      return await this.prisma.$transaction(async (tx) => {
        const pkg = await tx.package.update({
          where: { id },
          data,
          include: { _count: { select: { subscriptions: true } } },
        });
        const response = toAdminPackageResponse(pkg);
        await this.audit.log(
          {
            actorId: actor.id,
            action: 'package.update',
            entity: 'Package',
            entityId: id,
            before: toAdminPackageResponse(existing),
            after: response,
            ip: actor.ip,
          },
          tx,
        );
        return response;
      });
    } catch (e) {
      throw this.mapCodeConflict(e);
    }
  }

  /**
   * SİLMƏ — ŞƏRTLİ.
   *
   * Satılmış abunə paketin şərtlərinə istinad edir (`Subscription.packageId`).
   * Paketi silmək o abunələri qıracaq, üstəlik maliyyə izini itirəcək. Ona görə
   * abunəsi olan paket SİLİNMİR, `isActive=false` ilə satışdan çıxarılır —
   * mövcud abunələr toxunulmaz qalır, yeni satış dayanır.
   */
  async remove(
    id: string,
    actor: { id: string; ip: string | null },
  ): Promise<{ id: string; deleted: boolean; deactivated: boolean; subscriptionsCount: number }> {
    const existing = await this.prisma.package.findUnique({
      where: { id },
      include: { _count: { select: { subscriptions: true } } },
    });
    if (!existing) throw new NotFoundException('Paket tapılmadı');

    const subscriptionsCount = existing._count.subscriptions;
    const before = toAdminPackageResponse(existing);

    return this.prisma.$transaction(async (tx) => {
      if (subscriptionsCount > 0) {
        const pkg = await tx.package.update({ where: { id }, data: { isActive: false } });
        await this.audit.log(
          {
            actorId: actor.id,
            action: 'package.deactivate',
            entity: 'Package',
            entityId: id,
            before,
            after: { ...toPackageResponse(pkg), isActive: pkg.isActive, subscriptionsCount },
            ip: actor.ip,
          },
          tx,
        );
        return { id, deleted: false, deactivated: true, subscriptionsCount };
      }

      await tx.package.delete({ where: { id } });
      await this.audit.log(
        {
          actorId: actor.id,
          action: 'package.delete',
          entity: 'Package',
          entityId: id,
          before,
          ip: actor.ip,
        },
        tx,
      );
      return { id, deleted: true, deactivated: false, subscriptionsCount: 0 };
    });
  }

  /** `code` unikaldır — DB constraint pozuntusunu təmiz 409-a çevirir. */
  private mapCodeConflict(e: unknown): unknown {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      return new ConflictException('Bu kodla paket artıq mövcuddur');
    }
    return e;
  }
}
