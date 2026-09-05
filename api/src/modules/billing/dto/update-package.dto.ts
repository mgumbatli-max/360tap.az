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
import { MONEY_MAX, PACKAGE_CODE_RE } from './create-package.dto';

/**
 * NİYƏ `PartialType` DEYİL: layihədə `@nestjs/mapped-types` asılılığı yoxdur.
 * Sahələr əl ilə təkrarlanır, qaydalar `CreatePackageDto` ilə eynidir.
 * Bütün sahələr opsionaldır — yalnız göndərilənlər dəyişir (PATCH semantikası).
 */
export class UpdatePackageDto {
  @IsOptional()
  @IsString()
  @Matches(PACKAGE_CODE_RE, {
    message: 'Paket kodu 2-40 simvol, yalnız kiçik hərf, rəqəm, "-" və "_" ola bilər',
  })
  code?: string;

  @IsOptional() @IsString() @Length(2, 80) name?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Qiymət ən çox 2 onluq rəqəmlə yazılır' })
  @Min(0)
  @Max(MONEY_MAX)
  priceMonthly?: number;

  @IsOptional() @IsInt() @Min(1) @Max(3650) durationDays?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(MONEY_MAX)
  serviceBalance?: number;

  @IsOptional() @IsInt() @Min(0) @Max(100_000) listingQuota?: number;

  @IsOptional() @IsInt() @Min(0) @Max(100) discountPercent?: number;

  @IsOptional() @IsString() @Length(0, 2000) description?: string;

  @IsOptional() @IsBoolean() isActive?: boolean;

  @IsOptional() @IsInt() @Min(0) @Max(10_000) sortOrder?: number;

  @IsOptional() @IsObject() limits?: Record<string, unknown>;

  @IsOptional() @IsObject() features?: Record<string, unknown>;
}
