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

  async list(userId: string, limit = 30): Promise<NotificationView[]> {
    const items = await this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 50),
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
