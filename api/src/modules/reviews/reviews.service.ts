import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import type { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async create(reviewerId: string, dto: CreateReviewDto): Promise<{ id: string; rating: number }> {
    if (dto.reviewedId === reviewerId) {
      throw new BadRequestException('Özünüzə rəy yaza bilməzsiniz');
    }
    // Reytinq yalnız REAL əlaqədən sonra yazıla bilər: əvvəl yeganə yoxlama "özünə rəy yazma" idi,
    // ona görə tanımadığı satıcının reytinqini bir nəfər 1 ulduzla aşağı sala bilirdi.
    // Əlaqə sübutu = iki istifadəçi arasında mövcud söhbət (hər iki istiqamət: alıcı və ya satıcı rolunda).
    const contact = await this.prisma.conversation.findFirst({
      where: {
        OR: [
          { buyerId: reviewerId, sellerId: dto.reviewedId },
          { buyerId: dto.reviewedId, sellerId: reviewerId },
        ],
      },
      select: { id: true },
    });
    if (!contact) {
      throw new ForbiddenException(
        'Rəy yazmaq üçün əvvəlcə bu istifadəçi ilə yazışmalısınız — əlaqəniz olmayan istifadəçiyə reytinq verilmir',
      );
    }
    // listingId verilibsə, elanın sahibi rəy yazılan şəxs olmalıdır (yad elana bağlanmış rəy qarşısı alınır)
    if (dto.listingId) {
      const listing = await this.prisma.listing.findUnique({
        where: { id: dto.listingId },
        select: { ownerId: true },
      });
      if (!listing) throw new NotFoundException('Elan tapılmadı');
      if (listing.ownerId !== dto.reviewedId) {
        throw new BadRequestException('Elan rəy yazdığınız istifadəçiyə aid deyil');
      }
    }
    // Bir istifadəçi başqasına yalnız bir rəy saxlayır (təkrar → yenilə, idempotent)
    const existing = await this.prisma.review.findFirst({
      where: { reviewerId, reviewedId: dto.reviewedId },
      select: { id: true },
    });
    const review = existing
      ? await this.prisma.review.update({
          where: { id: existing.id },
          data: { rating: dto.rating, comment: dto.comment ?? null, listingId: dto.listingId ?? null },
        })
      : await this.prisma.review.create({
          data: {
            reviewerId,
            reviewedId: dto.reviewedId,
            listingId: dto.listingId ?? null,
            rating: dto.rating,
            comment: dto.comment ?? null,
          },
        });
    if (!existing) {
      const reviewer = await this.prisma.user.findUnique({
        where: { id: reviewerId },
        select: { fullName: true },
      });
      await this.notifications.create(
        dto.reviewedId,
        'system',
        'Yeni rəy aldınız',
        `${reviewer?.fullName ?? 'İstifadəçi'} sizə ${dto.rating}★ rəy yazdı`,
        { reviewId: review.id, rating: dto.rating },
      );
    }
    return { id: review.id, rating: review.rating };
  }

  async forUser(userId: string): Promise<{
    summary: { avg: number; count: number };
    reviews: Array<{ id: string; rating: number; comment: string | null; createdAt: Date; reviewer: { id: string; fullName: string } }>;
  }> {
    const [reviews, agg] = await this.prisma.$transaction([
      this.prisma.review.findMany({
        where: { reviewedId: userId },
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: { reviewer: { select: { id: true, fullName: true } } },
      }),
      this.prisma.review.aggregate({
        where: { reviewedId: userId },
        _avg: { rating: true },
        _count: true,
      }),
    ]);
    return {
      summary: {
        avg: agg._avg.rating ? Math.round(agg._avg.rating * 10) / 10 : 0,
        count: agg._count,
      },
      reviews: reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt,
        reviewer: { id: r.reviewer.id, fullName: r.reviewer.fullName },
      })),
    };
  }
}
