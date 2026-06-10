import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { ErpSyncStatus, ListingStatus, Prisma } from '@prisma/client';
import { createHash, randomBytes } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { uniqueSlug } from '../listings/utils/slug.util';
import type { ErpPublishDto } from './dto/erp-publish.dto';
import type { ErpIntegrationCtx } from './erp-auth.guard';

const ERP_TTL_DAYS = 365;

@Injectable()
export class ErpService {
  constructor(private readonly prisma: PrismaService) {}

  // ============ Provisioning (mağaza sahibi, JWT) ============

  async enableForOwner(ownerId: string): Promise<{
    erpTenantId: string;
    apiKey: string;
    webhookSecret: string;
    note: string;
  }> {
    const store = await this.prisma.store.findUnique({
      where: { ownerId },
      select: { id: true },
    });
    if (!store) throw new NotFoundException('Əvvəlcə mağaza yaradın (POST /me/store)');

    const erpTenantId = `tenant_${randomBytes(8).toString('hex')}`;
    const apiKey = `erp_${randomBytes(24).toString('hex')}`;
    const webhookSecret = randomBytes(24).toString('hex');
    const apiKeyHash = createHash('sha256').update(apiKey).digest('hex');

    await this.prisma.erpIntegration.upsert({
      where: { storeId: store.id },
      update: { erpTenantId, apiKeyHash, webhookSecret, isActive: true },
      create: { storeId: store.id, erpTenantId, apiKeyHash, webhookSecret, isActive: true },
    });

    return {
      erpTenantId,
      apiKey,
      webhookSecret,
      note: 'apiKey və webhookSecret yalnız indi göstərilir — təhlükəsiz saxlayın.',
    };
  }

  async statusForOwner(ownerId: string) {
    const store = await this.prisma.store.findUnique({
      where: { ownerId },
      select: { id: true },
    });
    if (!store) throw new NotFoundException('Mağaza tapılmadı');

    const integration = await this.prisma.erpIntegration.findUnique({
      where: { storeId: store.id },
      select: {
        erpTenantId: true,
        isActive: true,
        lastSyncAt: true,
        _count: { select: { links: true } },
      },
    });
    if (!integration) return { enabled: false };

    return {
      enabled: true,
      erpTenantId: integration.erpTenantId,
      isActive: integration.isActive,
      lastSyncAt: integration.lastSyncAt,
      productCount: integration._count.links,
    };
  }

  // ============ Gateway (ERP sistem, API key + HMAC) ============

  async publish(integration: ErpIntegrationCtx, dto: ErpPublishDto) {
    const category = await this.prisma.category.findUnique({
      where: { slug: dto.category },
      select: { id: true, vertical: true },
    });
    if (!category) {
      await this.log(integration.id, dto.external_id, 'publish', 'error', `Kateqoriya tapılmadı: ${dto.category}`);
      throw new BadRequestException(`Kateqoriya tapılmadı: ${dto.category}`);
    }

    const districtId = await this.resolveDistrict(dto.district, dto.region);
    const hash = createHash('sha256').update(JSON.stringify(dto)).digest('hex');

    const link = await this.prisma.erpProductLink.findUnique({
      where: {
        integrationId_externalId: { integrationId: integration.id, externalId: dto.external_id },
      },
      select: { listingId: true, lastHash: true },
    });

    // Idempotent: eyni payload + mövcud elan → no-op
    if (link?.listingId && link.lastHash === hash) {
      await this.log(integration.id, dto.external_id, 'publish', 'ok', 'idempotent no-op');
      return { listingId: link.listingId, externalId: dto.external_id, status: 'unchanged' as const };
    }

    const inStock = (dto.stock_qty ?? 1) > 0;
    const status: ListingStatus = inStock ? 'active' : 'out_of_stock';

    const common = {
      categoryId: category.id,
      vertical: category.vertical,
      districtId,
      title: dto.title,
      description: dto.description,
      price: dto.price ?? null,
      oldPrice: dto.old_price ?? null,
      currency: dto.currency ?? 'AZN',
      stockQty: dto.stock_qty ?? null,
      inStock,
      hasDelivery: dto.delivery ?? false,
      hasCredit: dto.credit ?? false,
      hasWarranty: (dto.warranty_months ?? 0) > 0,
      contactWhatsapp: !!dto.whatsapp,
      contactPhone: dto.whatsapp ?? null,
      attributes: (dto.attributes ?? {}) as Prisma.InputJsonValue,
      status,
      publishedAt: new Date(),
      expiresAt: new Date(Date.now() + ERP_TTL_DAYS * 86_400_000),
    };

    const listingId = await this.prisma.$transaction(async (tx) => {
      let id: string;
      if (link?.listingId) {
        await tx.listing.update({ where: { id: link.listingId }, data: common });
        id = link.listingId;
      } else {
        const created = await tx.listing.create({
          data: {
            ...common,
            ownerId: integration.store.ownerId,
            storeId: integration.store.id,
            source: 'erp',
            slug: uniqueSlug(dto.title),
          },
          select: { id: true },
        });
        id = created.id;
      }

      if (dto.images) {
        await tx.listingImage.deleteMany({ where: { listingId: id } });
        if (dto.images.length) {
          await tx.listingImage.createMany({
            data: dto.images.map((url, i) => ({ listingId: id, url, sortOrder: i })),
          });
        }
      }

      await tx.erpProductLink.upsert({
        where: {
          integrationId_externalId: { integrationId: integration.id, externalId: dto.external_id },
        },
        update: { listingId: id, lastHash: hash, syncStatus: 'ok' },
        create: {
          integrationId: integration.id,
          externalId: dto.external_id,
          listingId: id,
          lastHash: hash,
          syncStatus: 'ok',
        },
      });
      return id;
    });

    await this.touch(integration.id, dto.external_id, link ? 'update' : 'publish');
    return { listingId, externalId: dto.external_id, status };
  }

  async updateStock(integration: ErpIntegrationCtx, externalId: string, stockQty: number) {
    const listingId = await this.requireListing(integration.id, externalId);
    const inStock = stockQty > 0;
    await this.prisma.listing.update({
      where: { id: listingId },
      data: { stockQty, inStock, status: inStock ? 'active' : 'out_of_stock' },
    });
    await this.touch(integration.id, externalId, 'update_stock');
    return {
      listingId,
      externalId,
      stockQty,
      inStock,
      status: inStock ? 'active' : 'out_of_stock',
    };
  }

  async updatePrice(
    integration: ErpIntegrationCtx,
    externalId: string,
    price: number,
    oldPrice?: number,
  ) {
    const listingId = await this.requireListing(integration.id, externalId);
    await this.prisma.listing.update({
      where: { id: listingId },
      data: { price, oldPrice: oldPrice ?? null },
    });
    await this.touch(integration.id, externalId, 'update_price');
    return { listingId, externalId, price };
  }

  async remove(integration: ErpIntegrationCtx, externalId: string) {
    const listingId = await this.requireListing(integration.id, externalId);
    await this.prisma.listing.update({ where: { id: listingId }, data: { status: 'archived' } });
    await this.touch(integration.id, externalId, 'delete');
    return { listingId, externalId, status: 'archived' as const };
  }

  // ============ helpers ============

  private async resolveDistrict(districtSlug?: string, regionSlug?: string): Promise<string | null> {
    if (districtSlug) {
      const d = await this.prisma.district.findUnique({
        where: { slug: districtSlug },
        select: { id: true },
      });
      if (d) return d.id;
    }
    if (regionSlug) {
      const r = await this.prisma.region.findUnique({
        where: { slug: regionSlug },
        select: { districts: { select: { id: true }, take: 1 } },
      });
      return r?.districts[0]?.id ?? null;
    }
    return null;
  }

  private async requireListing(integrationId: string, externalId: string): Promise<string> {
    const link = await this.prisma.erpProductLink.findUnique({
      where: { integrationId_externalId: { integrationId, externalId } },
      select: { listingId: true },
    });
    if (!link?.listingId) {
      await this.log(integrationId, externalId, 'sync', 'error', 'Məhsul tapılmadı (əvvəlcə publish edin)');
      throw new NotFoundException(`Məhsul tapılmadı: ${externalId}`);
    }
    return link.listingId;
  }

  private async touch(integrationId: string, externalId: string, action: string): Promise<void> {
    await this.prisma.erpIntegration.update({
      where: { id: integrationId },
      data: { lastSyncAt: new Date() },
    });
    await this.log(integrationId, externalId, action, 'ok');
  }

  private async log(
    integrationId: string,
    externalId: string,
    action: string,
    status: ErpSyncStatus,
    error?: string,
  ): Promise<void> {
    await this.prisma.erpSyncLog.create({
      data: { integrationId, externalId, action, status, error: error ?? null },
    });
  }
}
