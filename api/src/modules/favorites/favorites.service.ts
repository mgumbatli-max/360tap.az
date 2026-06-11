import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { toListingResponse, type ListingResponse } from '../listings/dto/listing-response.dto';

const LISTING_INCLUDE = {
  images: { orderBy: { sortOrder: 'asc' as const }, take: 1 },
  category: { select: { nameAz: true, slug: true } },
  district: {
    select: {
      nameAz: true,
      slug: true,
      region: { select: { nameAz: true, slug: true } },
    },
  },
};

@Injectable()
export class FavoritesService {
  constructor(private readonly prisma: PrismaService) {}

  async add(userId: string, listingId: string): Promise<{ favorited: true }> {
    try {
      await this.prisma.favorite.create({ data: { userId, listingId } });
      await this.prisma.listing.update({
        where: { id: listingId },
        data: { favoritesCount: { increment: 1 } },
      });
    } catch {
      // artıq mövcuddur (unique) → idempotent
    }
    return { favorited: true };
  }

  async remove(userId: string, listingId: string): Promise<{ favorited: false }> {
    const deleted = await this.prisma.favorite.deleteMany({ where: { userId, listingId } });
    if (deleted.count > 0) {
      await this.prisma.listing
        .update({ where: { id: listingId }, data: { favoritesCount: { decrement: 1 } } })
        .catch(() => undefined);
    }
    return { favorited: false };
  }

  async list(userId: string): Promise<ListingResponse[]> {
    const favs = await this.prisma.favorite.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { listing: { include: LISTING_INCLUDE } },
    });
    return favs.map((f) => toListingResponse(f.listing));
  }

  async check(userId: string, ids: string[]): Promise<string[]> {
    if (!ids.length) return [];
    const favs = await this.prisma.favorite.findMany({
      where: { userId, listingId: { in: ids.slice(0, 100) } },
      select: { listingId: true },
    });
    return favs.map((f) => f.listingId);
  }
}
