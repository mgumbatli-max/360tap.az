import { BadRequestException, Injectable } from '@nestjs/common';
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
