import { Injectable } from '@nestjs/common';
import type { NotificationType, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export interface NotificationView {
  id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  data: Prisma.JsonValue;
  read: boolean;
  createdAt: Date;
}

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  // Digər modullar (chat, reviews...) çağırır — bildiriş kritik deyil, səssiz keçir
  async create(
    userId: string,
    type: NotificationType,
    title: string,
    body?: string | null,
    data?: Prisma.InputJsonValue,
  ): Promise<void> {
    try {
      await this.prisma.notification.create({
        data: { userId, type, title, body: body ?? null, data: data ?? undefined },
      });
    } catch {
      /* bildiriş uğursuz olarsa əsas axını pozma */
    }
  }

  // Səhifələmə: `limit` (default 30, tavan 50) + keyset `cursor`.
  // Cavab QƏSDƏN massiv olaraq qalır — `{data, meta}` zərfinə keçmək mövcud
  // frontend-i (NotificationBell və bildirişlər səhifəsi) eyni anda sındırardı;
  // klient «daha var?» sualını `nəticə.length === limit` ilə cavablandıra bilər.
  async list(userId: string, limit = 30, cursor?: string): Promise<NotificationView[]> {
    const take = Math.min(Math.max(limit, 1), 50);
    if (cursor) {
      // Yad/silinmiş kursor id-də Prisma gözlənilməz nəticə verir — əvvəl sahiblik yoxlanır
      const anchor = await this.prisma.notification.findFirst({
        where: { id: cursor, userId },
        select: { id: true },
      });
      if (!anchor) return [];
    }
    const items = await this.prisma.notification.findMany({
      where: { userId },
      // id ikinci meyar kimi: eyni createdAt-da sıra sabit qalsın (kursor sürüşməsin)
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    return items.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      body: n.body,
      data: n.data,
      read: n.readAt != null,
      createdAt: n.createdAt,
    }));
  }

  async unreadCount(userId: string): Promise<{ count: number }> {
    const count = await this.prisma.notification.count({ where: { userId, readAt: null } });
    return { count };
  }

  async markRead(userId: string, id: string): Promise<{ ok: true }> {
    await this.prisma.notification.updateMany({
      where: { id, userId, readAt: null },
      data: { readAt: new Date() },
    });
    return { ok: true };
  }

  async markAllRead(userId: string): Promise<{ ok: true }> {
    await this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
    return { ok: true };
  }
}
