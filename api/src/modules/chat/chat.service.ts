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
        // Oxunmamış sayı: söhbət siyahısında heç bir göstərici yox idi, halbuki
        // `messages.readAt` onsuz da doldurulur (getMessages:120). Aqreqasiya DB-də
        // edilir — söhbət başına ayrıca sorğu (N+1) açmamaq üçün `_count` seçildi.
        _count: {
          select: { messages: { where: { senderId: { not: userId }, readAt: null } } },
        },
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
        // Yeni sahə — mövcud klientlər üçün geriyə uyğundur (əlavədir, heç nə silinmir)
        unreadCount: c._count.messages,
      };
    });
  }

  // Mesajlar ƏN YENİDƏN köhnəyə doğru səhifələnir: əvvəl `orderBy asc + take 200` ilə
  // ən KÖHNƏ 200 mesaj qaytarılırdı — 200-dən çox mesajı olan söhbətdə ən yeni mesajlar
  // heç bir yolla görünmürdü və söhbətlər siyahısındakı lastMessage ilə ziddiyyət yaradırdı.
  // Cavab UI üçün xronoloji sıraya çevrilir (köhnə → yeni), `meta.hasMore` isə köhnəyə
  // doğru davam etmək üçün göstəricidir.
  async getMessages(
    userId: string,
    convId: string,
    opts: { limit?: number; before?: string } = {},
  ) {
    const conv = await this.prisma.conversation.findUnique({
      where: { id: convId },
      select: { buyerId: true, sellerId: true },
    });
    if (!conv) throw new NotFoundException('Söhbət tapılmadı');
    if (conv.buyerId !== userId && conv.sellerId !== userId) {
      throw new ForbiddenException('Bu söhbət sizə aid deyil');
    }
    // Default 200 saxlanılır ki, mövcud frontend (səhifələmə düyməsi yoxdur) eyni həcmdə tarixçə görsün
    const limit = Math.min(Math.max(opts.limit ?? 200, 1), 200);
    if (opts.before) {
      // Kursor mövcudluğu yoxlanılır: yad/silinmiş id-də Prisma cursor sorğusu gözlənilməz nəticə verir
      const anchor = await this.prisma.message.findFirst({
        where: { id: opts.before, conversationId: convId },
        select: { id: true },
      });
      if (!anchor) {
        throw new BadRequestException('Səhifələmə göstəricisi (before) bu söhbətə aid deyil');
      }
    }
    const rows = await this.prisma.message.findMany({
      where: { conversationId: convId },
      // id ikinci meyar kimi: eyni createdAt-lı mesajlarda sıra sabit qalsın (kursor sürüşməsin)
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1, // +1 — əlavə sətir yalnız "daha köhnəsi var" göstəricisidir
      ...(opts.before ? { cursor: { id: opts.before }, skip: 1 } : {}),
    });
    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    // Qarşı tərəfin mesajlarını oxunmuş işarələ
    await this.prisma.message
      .updateMany({
        where: { conversationId: convId, senderId: { not: userId }, readAt: null },
        data: { readAt: new Date() },
      })
      .catch(() => undefined);
    const chronological = [...page].reverse();
    return {
      data: chronological.map((m) => ({
        id: m.id,
        content: m.content,
        senderId: m.senderId,
        mine: m.senderId === userId,
        createdAt: m.createdAt,
      })),
      // nextBefore = səhifədəki ən köhnə mesaj: növbəti sorğuda ?before= ilə göndərilir
      meta: { limit, hasMore, nextBefore: chronological[0]?.id ?? null },
    };
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
