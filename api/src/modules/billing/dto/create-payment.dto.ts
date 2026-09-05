import { PaymentStatus } from '@prisma/client';
import { IsEnum, IsNumber, IsOptional, IsString, IsUUID, Length, Matches, Max, Min } from 'class-validator';

/** Decimal(14,2) sxem məhdudiyyəti. */
const AMOUNT_MAX = 999_999_999_999.99;

/**
 * ƏL İLƏ ÖDƏNİŞ QEYDİ.
 *
 * PSP (ödəniş provayderi) hələ seçilməyib — bu endpoint ödəniş QƏBUL ETMİR,
 * yalnız kənarda (bank köçürməsi, nağd) baş vermiş faktı qeyd edir. Ona görə
 * `provider`/`providerRef` sərbəstdir və status defolt `paid`-dir: admin artıq
 * baş vermiş hadisəni yazır, gözlənilən ödənişi deyil.
 */
export class CreatePaymentDto {
  @IsUUID('4', { message: 'userId düzgün UUID olmalıdır' })
  userId!: string;

  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Məbləğ ən çox 2 onluq rəqəmlə yazılır' })
  @Min(0.01, { message: 'Məbləğ 0-dan böyük olmalıdır' })
  @Max(AMOUNT_MAX)
  amount!: number;

  @IsOptional()
  @Matches(/^[A-Z]{3}$/, { message: 'Valyuta ISO-4217 kodu olmalıdır (məs. AZN)' })
  currency?: string;

  @IsString()
  @Matches(/^[a-z][a-z0-9_]{1,29}$/, {
    message: 'Ödəniş tipi kiçik hərflə, 2-30 simvol olmalıdır (məs. package, promotion)',
  })
  type!: string;

  @IsOptional() @IsEnum(PaymentStatus, { message: 'Ödəniş statusu yanlışdır' })
  status?: PaymentStatus;

  @IsOptional() @IsString() @Length(1, 40) provider?: string;

  @IsOptional() @IsString() @Length(1, 120) providerRef?: string;

  /** Sərbəst izah — `metadata.note` kimi saxlanılır. */
  @IsOptional() @IsString() @Length(0, 500) note?: string;
}
