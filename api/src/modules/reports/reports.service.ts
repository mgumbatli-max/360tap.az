import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { ReportStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreateReportDto } from './dto/create-report.dto';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(reporterId: string, dto: CreateReportDto): Promise<{ id: string; status: ReportStatus }> {
    if (!dto.listingId && !dto.userId) {
      throw new BadRequestException('Şikayət üçün elan və ya istifadəçi göstərilməlidir');
    }
    // `reports` cədvəlində FK yoxdur (Report modelində relation qurulmayıb), ona görə
    // mövcud olmayan elan/istifadəçi üçün şikayət DB tərəfindən DAYANDIRILMIR — sətir
    // yaranır və 201 qayıdır. Sxem dəyişikliyi (relation + @@unique) migrasiya tələb edir,
    // bu tapşırıqda isə migrasiya qadağandır → yoxlama xidmət səviyyəsində edilir.
    if (dto.userId === reporterId) {
      throw new BadRequestException('Öz hesabınızı şikayət edə bilməzsiniz');
    }
    if (dto.listingId) {
      const listing = await this.prisma.listing.findUnique({
        where: { id: dto.listingId },
        select: { id: true },
      });
      if (!listing) throw new NotFoundException('Elan tapılmadı');
    }
    if (dto.userId) {
      const target = await this.prisma.user.findUnique({
        where: { id: dto.userId },
        select: { id: true },
      });
      if (!target) throw new NotFoundException('İstifadəçi tapılmadı');
    }
    // Təkrar şikayət: eyni istifadəçinin eyni hədəf üzrə HƏLƏ AÇIQ şikayəti varsa yenisi
    // yaradılmır, mövcud sətir qaytarılır (idempotent) — moderasiya növbəsi dublikatla
    // dolmasın. Bağlanmış şikayətdən sonra yenidən şikayət etmək mümkün qalır.
    const open = await this.prisma.report.findFirst({
      where: {
        reporterId,
        status: 'open',
        listingId: dto.listingId ?? null,
        userId: dto.userId ?? null,
      },
      select: { id: true, status: true },
    });
    if (open) return { id: open.id, status: open.status };

    const r = await this.prisma.report.create({
      data: {
        reporterId,
        listingId: dto.listingId ?? null,
        userId: dto.userId ?? null,
        reason: dto.reason,
        detail: dto.detail ?? null,
      },
      select: { id: true, status: true },
    });
    return { id: r.id, status: r.status };
  }
}
