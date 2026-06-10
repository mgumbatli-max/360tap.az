import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  toListingResponse,
  type ListingResponse,
} from '../listings/dto/listing-response.dto';
import type { ListMeta } from '../listings/listings.service';
import { makeSlug } from '../listings/utils/slug.util';
import type { CreateStoreDto } from './dto/create-store.dto';

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

@Injectable()
export class StoresService {
  constructor(private readonly prisma: PrismaService) {}

  /** İstifadəçi üçün mağaza yaradır (hər istifadəçidə bir mağaza). */
  async create(ownerId: string, dto: CreateStoreDto) {
    const existing = await this.prisma.store.findUnique({
      where: { ownerId },
      select: { id: true },
    });
    if (existing) throw new ConflictException('Bu istifadəçinin artıq mağazası var');

    const slug = await this.uniqueSlug(dto.name);

    const [store] = await this.prisma.$transaction([
      this.prisma.store.create({
        data: {
          ownerId,
          slug,
          name: dto.name,
          description: dto.description ?? null,
          phone: dto.phone ?? null,
          whatsapp: dto.whatsapp ?? null,
          instagram: dto.instagram ?? null,
        },
        select: STORE_PUBLIC_SELECT,
      }),
      this.prisma.user.update({
        where: { id: ownerId },
        data: { sellerType: 'store', role: 'business' },
      }),
    ]);
    return store;
  }

  /** Public mağaza profili + aktiv elan sayı. */
  async getBySlug(slug: string) {
    const store = await this.prisma.store.findUnique({
      where: { slug },
      select: STORE_PUBLIC_SELECT,
    });
    if (!store) throw new NotFoundException('Mağaza tapılmadı');
    const activeListings = await this.prisma.listing.count({
      where: { storeId: store.id, status: 'active' },
    });
    return { ...store, activeListings };
  }

  /** Mağazanın aktiv elanları (paginated). */
  async getListings(
    slug: string,
    q: { page?: number; limit?: number },
  ): Promise<{ data: ListingResponse[]; meta: ListMeta }> {
    const store = await this.prisma.store.findUnique({
      where: { slug },
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
