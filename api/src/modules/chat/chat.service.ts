import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  // Söhbət başlat və ya tap (alıcı = cari user, satıcı = elan sahibi)
  async start(buyerId: string, listingId: string, message?: string): Promise<{ id: string }> {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      select: { ownerId: true },
    });
    if (!listing) throw new NotFoundException('Elan tapılmadı');
    if (listing.ownerId === buyerId) {
      throw new BadRequestException('Öz elanınıza mesaj yaza bilməzsiniz');
    }
    const conv = await this.prisma.conversation.upsert({
      where: {
        listingId_buyerId_sellerId: { listingId, buyerId, sellerId: listing.ownerId },
      },
      create: { listingId, buyerId, sellerId: listing.ownerId },
      update: {},
    });
    if (message?.trim()) {
      await this.sendMessage(buyerId, conv.id, message);
    }
    return { id: conv.id };
  }

  async listConversations(userId: string) {
    const convs = await this.prisma.conversation.findMany({
      where: { OR: [{ buyerId: userId }, { sellerId: userId }] },
      orderBy: [{ lastMessageAt: { sort: 'desc', nulls: 'last' } }, { createdAt: 'desc' }],
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            price: true,
            currency: true,
            images: { select: { url: true }, orderBy: { sortOrder: 'asc' }, take: 1 },
          },
        },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });
    const otherIds = [
      ...new Set(convs.map((c) => (c.buyerId === userId ? c.sellerId : c.buyerId))),
    ];
    const users = await this.prisma.user.findMany({
      where: { id: { in: otherIds } },
      select: { id: true, fullName: true },
    });
    const nameMap = new Map(users.map((u) => [u.id, u.fullName]));
    return convs.map((c) => {
      const otherId = c.buyerId === userId ? c.sellerId : c.buyerId;
      return {
        id: c.id,
        listing: {
          id: c.listing.id,
          title: c.listing.title,
          price: c.listing.price ? Number(c.listing.price) : null,
          currency: c.listing.currency,
          cover: c.listing.images[0]?.url ?? null,
        },
        otherUser: { id: otherId, fullName: nameMap.get(otherId) ?? 'İstifadəçi' },
        lastMessage: c.messages[0]?.content ?? null,
        lastMessageAt: c.lastMessageAt,
      };
    });
  }

  async getMessages(userId: string, convId: string) {
    const conv = await this.prisma.conversation.findUnique({
      where: { id: convId },
      select: { buyerId: true, sellerId: true },
    });
    if (!conv) throw new NotFoundException('Söhbət tapılmadı');
    if (conv.buyerId !== userId && conv.sellerId !== userId) {
      throw new ForbiddenException('Bu söhbət sizə aid deyil');
    }
    const messages = await this.prisma.message.findMany({
      where: { conversationId: convId },
      orderBy: { createdAt: 'asc' },
      take: 200,
    });
    // Qarşı tərəfin mesajlarını oxunmuş işarələ
    await this.prisma.message
      .updateMany({
        where: { conversationId: convId, senderId: { not: userId }, readAt: null },
        data: { readAt: new Date() },
      })
      .catch(() => undefined);
    return messages.map((m) => ({
      id: m.id,
      content: m.content,
      senderId: m.senderId,
      mine: m.senderId === userId,
      createdAt: m.createdAt,
    }));
  }

  async sendMessage(userId: string, convId: string, content: string) {
    const text = content.trim().slice(0, 2000);
    if (!text) throw new BadRequestException('Mesaj boş ola bilməz');
    const conv = await this.prisma.conversation.findUnique({
      where: { id: convId },
      select: { buyerId: true, sellerId: true },
    });
    if (!conv) throw new NotFoundException('Söhbət tapılmadı');
    if (conv.buyerId !== userId && conv.sellerId !== userId) {
      throw new ForbiddenException('Bu söhbət sizə aid deyil');
    }
    const msg = await this.prisma.message.create({
      data: { conversationId: convId, senderId: userId, content: text },
    });
    await this.prisma.conversation.update({
      where: { id: convId },
      data: { lastMessageAt: new Date() },
    });
    // Qarşı tərəfə bildiriş
    const recipientId = conv.buyerId === userId ? conv.sellerId : conv.buyerId;
    await this.notifications.create(
      recipientId,
      'message',
      'Yeni mesaj',
      text.slice(0, 120),
      { conversationId: convId },
    );
    return {
      id: msg.id,
      content: msg.content,
      senderId: userId,
      mine: true,
      createdAt: msg.createdAt,
    };
  }
}
