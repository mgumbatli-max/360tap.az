import { IsBoolean, IsInt, IsNumber, IsOptional, Max, Min } from 'class-validator';

/**
 * NİYƏ PUT (POST/PATCH deyil): limit sətri kateqoriya ilə 1:1-dir və açarı
 * kateqoriya id-sidir — «bu kateqoriyanın limiti BUDUR» ifadəsi idempotentdir.
 */
export class UpsertCategoryLimitDto {
  /** 30 gün ərzində pulsuz elan sayı (fərdi satıcı). 0 = pulsuz elan yoxdur. */
  @IsInt() @Min(0) @Max(10_000) freePerMonth!: number;

  /** Mağaza hesabı üçün ayrıca limit; göndərilməzsə fərdi limitlə eyni sayılır. */
  @IsOptional() @IsInt() @Min(0) @Max(10_000) storeFreePerMonth?: number;

  /** Limit aşılanda tək elanın qiyməti (AZN). 0 = əlavə elan satılmır. */
  @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) @Max(99_999_999) extraListingPrice!: number;

  @IsBoolean() enabled!: boolean;
}
