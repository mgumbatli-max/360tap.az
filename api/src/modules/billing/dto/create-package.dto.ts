import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  Min,
} from 'class-validator';

/** Kod URL-də və inteqrasiyalarda açar kimi işlədilir — sabit, kiçik hərfli olmalıdır. */
export const PACKAGE_CODE_RE = /^[a-z0-9][a-z0-9_-]{1,39}$/;

/** Decimal(10,2) sxem məhdudiyyəti — daha böyük dəyər DB səviyyəsində 500 verərdi. */
export const MONEY_MAX = 99_999_999.99;

export class CreatePackageDto {
  @IsString()
  @Matches(PACKAGE_CODE_RE, {
    message: 'Paket kodu 2-40 simvol, yalnız kiçik hərf, rəqəm, "-" və "_" ola bilər',
  })
  code!: string;

  @IsString()
  @Length(2, 80, { message: 'Paket adı 2-80 simvol olmalıdır' })
  name!: string;

  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Qiymət ən çox 2 onluq rəqəmlə yazılır' })
  @Min(0)
  @Max(MONEY_MAX)
  priceMonthly!: number;

  @IsOptional() @IsInt() @Min(1) @Max(3650) durationDays?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Xidmət balansı ən çox 2 onluq rəqəmlə yazılır' })
  @Min(0)
  @Max(MONEY_MAX)
  serviceBalance?: number;

  @IsOptional() @IsInt() @Min(0) @Max(100_000) listingQuota?: number;

  @IsOptional() @IsInt() @Min(0) @Max(100) discountPercent?: number;

  @IsOptional() @IsString() @Length(0, 2000) description?: string;

  /**
   * Defolt `false` — sxemdəki defoltla eynidir. Yeni paket dərhal satışa
   * çıxmamalıdır; admin şərtləri yoxlayıb ayrıca aktivləşdirir.
   */
  @IsOptional() @IsBoolean() isActive?: boolean;

  @IsOptional() @IsInt() @Min(0) @Max(10_000) sortOrder?: number;

  /** Sərbəst formalı şərtlər (məs. `{"maxPhotos": 20}`) — sxemdə `Json`. */
  @IsOptional() @IsObject() limits?: Record<string, unknown>;

  /** Vitrində sadalanan üstünlüklər (məs. `{"support": "24/7"}`). */
  @IsOptional() @IsObject() features?: Record<string, unknown>;
}
