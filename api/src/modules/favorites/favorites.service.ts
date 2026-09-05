import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
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

  // Əvvəl bütün catch bloku BOŞ idi: mövcud olmayan elan (FK P2003) və ya istənilən DB
  // nasazlığı da udulurdu, cavab isə 201 {favorited:true} olurdu — yəni klient «əlavə
  // edildi» görürdü, sətir isə yaranmırdı. İndi:
  //   1) elanın varlığı ƏVVƏLCƏDƏN yoxlanır → yoxdursa 404 (yanlış müsbət cavab yox);
  //   2) catch YALNIZ unique konfliktini (P2002 → artıq sevimlidir) udur, qalan xətalar qalxır;
  //   3) create + sayğac artımı bir tranzaksiyada — sayğac sətirlə sinxron qalır.
  // Alternativ (yoxlamasız, sadəcə catch daralması) rədd edildi: onda yad id 500 verərdi,
  // halbuki düzgün cavab 404-dür.
  async add(userId: string, listingId: string): Promise<{ favorited: true }> {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      select: { id: true },
    });
    if (!listing) throw new NotFoundException('Elan tapılmadı');

    try {
      await this.prisma.$transaction([
        this.prisma.favorite.create({ data: { userId, listingId } }),
        this.prisma.listing.update({
          where: { id: listingId },
          data: { favoritesCount: { increment: 1 } },
        }),
      ]);
    } catch (e) {
      // artıq mövcuddur (unique) → idempotent; başqa xəta gizlədilmir
      if (!(e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002')) throw e;
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
