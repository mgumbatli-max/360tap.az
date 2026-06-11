import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreateSavedSearchDto } from './dto/create-saved-search.dto';

@Injectable()
export class SavedSearchesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateSavedSearchDto): Promise<{ id: string }> {
    const s = await this.prisma.savedSearch.create({
      data: {
        userId,
        name: dto.name ?? null,
        query: dto.query as Prisma.InputJsonValue,
        notify: dto.notify ?? true,
      },
    });
    return { id: s.id };
  }

  async list(userId: string) {
    const items = await this.prisma.savedSearch.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return items.map((s) => ({
      id: s.id,
      name: s.name,
      query: s.query,
      notify: s.notify,
      createdAt: s.createdAt,
    }));
  }

  async remove(userId: string, id: string): Promise<{ ok: true }> {
    await this.prisma.savedSearch.deleteMany({ where: { id, userId } });
    return { ok: true };
  }

  async setNotify(userId: string, id: string, notify: boolean): Promise<{ ok: true }> {
    await this.prisma.savedSearch.updateMany({ where: { id, userId }, data: { notify } });
    return { ok: true };
  }
}
