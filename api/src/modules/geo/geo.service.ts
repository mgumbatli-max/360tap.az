import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { haversineKm } from './utils/haversine';
import { isSafeSlug } from './utils/slug';

export interface ResolvedLocation {
  districtId: string;
  districtSlug: string;
  districtName: string;
  regionSlug: string;
  regionName: string;
  distanceKm: number;
}

@Injectable()
export class GeoService {
  constructor(private readonly prisma: PrismaService) {}

  /** Bütün aktiv regionlar (sortOrder üzrə). */
  regions() {
    return this.prisma.region.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: { id: true, slug: true, nameAz: true, nameRu: true, lat: true, lng: true },
    });
  }

  /** Regionun rayonları. */
  async districts(regionSlug: string) {
    // Format yoxlaması DB sorğusundan ƏVVƏL: yararsız slug artıq 500 yox,
    // mövcud olmayan region ilə eyni 404 verir (paritet).
    // Mesajda xam dəyər ƏKS OLUNMUR — idarəedici simvollar cavaba düşməsin.
    if (!isSafeSlug(regionSlug)) throw new NotFoundException('Region tapılmadı');
    const region = await this.prisma.region.findUnique({
      where: { slug: regionSlug },
      select: { id: true },
    });
    if (!region) throw new NotFoundException(`Region tapılmadı: ${regionSlug}`);
    return this.prisma.district.findMany({
      where: { regionId: region.id },
      orderBy: { nameAz: 'asc' },
      select: { id: true, slug: true, nameAz: true, lat: true, lng: true },
    });
  }

  /** Rayonun yaxın rayonları (rank üzrə). */
  async nearby(districtId: string) {
    const rows = await this.prisma.nearbyDistrict.findMany({
      where: { originId: districtId },
      orderBy: { rank: 'asc' },
      select: {
        distanceKm: true,
        rank: true,
        target: {
          select: {
            id: true,
            slug: true,
            nameAz: true,
            region: { select: { slug: true, nameAz: true } },
          },
        },
      },
    });
    return rows.map((r) => ({
      districtId: r.target.id,
      districtSlug: r.target.slug,
      districtName: r.target.nameAz,
      regionSlug: r.target.region.slug,
      regionName: r.target.region.nameAz,
      distanceKm: r.distanceKm,
      rank: r.rank,
    }));
  }

  /** "Mənim yaxınlığımda" — koordinata ən yaxın rayon. */
  async resolveNearest(lat: number, lng: number): Promise<ResolvedLocation> {
    // Düzgün ədəd + Azərbaycan hüdudları (boş/0,0/qarışıq dəyərləri rədd)
    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lng) ||
      lat < 38 ||
      lat > 42.5 ||
      lng < 44 ||
      lng > 51
    ) {
      throw new BadRequestException('Koordinat Azərbaycan hüdudlarında olmalıdır');
    }
    const districts = await this.prisma.district.findMany({
      select: {
        id: true,
        slug: true,
        nameAz: true,
        lat: true,
        lng: true,
        region: { select: { slug: true, nameAz: true } },
      },
    });

    let best: (typeof districts)[number] | null = null;
    let bestDist = Infinity;
    for (const d of districts) {
      if (d.lat === null || d.lng === null) continue;
      const dist = haversineKm(lat, lng, d.lat, d.lng);
      if (dist < bestDist) {
        bestDist = dist;
        best = d;
      }
    }
    if (!best) throw new NotFoundException('Yaxın rayon tapılmadı');

    return {
      districtId: best.id,
      districtSlug: best.slug,
      districtName: best.nameAz,
      regionSlug: best.region.slug,
      regionName: best.region.nameAz,
      distanceKm: Math.round(bestDist),
    };
  }
}
