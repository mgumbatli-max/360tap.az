import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from './audit.service';
import { toPaymentResponse, type PaymentResponse } from './dto/billing-response.dto';
import type { CreatePaymentDto } from './dto/create-payment.dto';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /**
   * ƏL İLƏ ÖDƏNİŞ QEYDİ.
   *
   * NİYƏ PSP İNTEQRASİYASI YOXDUR: ödəniş provayderi hələ seçilməyib. Yarımçıq
   * inteqrasiya yazmaq əvəzinə yalnız FAKTI qeyd edirik — kənarda (bank köçürməsi,
   * nağd) alınmış məbləğ. `metadata.recordedBy = 'admin_manual'` sonradan avtomatik
   * ödənişlərdən ayırd etməyə imkan verir.
   */
  async record(
    dto: CreatePaymentDto,
    actor: { id: string; ip: string | null },
  ): Promise<PaymentResponse> {
    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
      select: { id: true },
    });
    if (!user) throw new NotFoundException('İstifadəçi tapılmadı');

    const metadata: Prisma.InputJsonValue = {
      recordedBy: 'admin_manual',
      ...(dto.note ? { note: dto.note } : {}),
    };

    return this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          userId: user.id,
          amount: dto.amount,
          currency: dto.currency ?? 'AZN',
          type: dto.type,
          // Admin artıq BAŞ VERMİŞ hadisəni yazır — gözlənilən ödənişi deyil.
          status: dto.status ?? 'paid',
          provider: dto.provider ?? null,
          providerRef: dto.providerRef ?? null,
          metadata,
        },
      });
      const response = toPaymentResponse(payment);
      await this.audit.log(
        {
          actorId: actor.id,
          action: 'payment.record',
          entity: 'Payment',
          entityId: payment.id,
          after: response,
          ip: actor.ip,
        },
        tx,
      );
      return response;
    });
  }
}
