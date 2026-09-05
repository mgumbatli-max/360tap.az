import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

/**
 * Query sətirləri həmişə string gəlir; layihədə `enableImplicitConversion` qəsdən
 * bağlıdır (main.ts), ona görə hər rəqəm sahəsində açıq `@Type(() => Number)` var.
 */
export class PaginationQueryDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(50) limit?: number;
}

/** Abunə statusları sərbəst mətn deyil — sxemdə String olsa da, dəyər çoxluğu qapalıdır. */
export const SUBSCRIPTION_STATUSES = ['active', 'expired', 'cancelled'] as const;
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

export class QuerySubscriptionsDto extends PaginationQueryDto {
  @IsOptional() @IsUUID('4') userId?: string;

  @IsOptional()
  @IsIn(SUBSCRIPTION_STATUSES, { message: 'Status yalnız active, expired və ya cancelled ola bilər' })
  status?: SubscriptionStatus;
}

export class ListingLimitsQueryDto {
  /** Verilməzsə: konfiqurasiya edilmiş bütün kateqoriya limitləri qaytarılır. */
  @IsOptional() @IsUUID('4', { message: 'categoryId düzgün UUID olmalıdır' }) categoryId?: string;
}
