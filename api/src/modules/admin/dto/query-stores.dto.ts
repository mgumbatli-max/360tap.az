import { Type } from 'class-transformer';
import { StoreStatus } from '@prisma/client';
import { IsBooleanString, IsEnum, IsInt, IsOptional, IsString, Length, Max, Min } from 'class-validator';

export class QueryStoresDto {
  @IsOptional() @IsEnum(StoreStatus, { message: 'status: pending | active | suspended' })
  status?: StoreStatus;

  /** Ad və ya slug üzrə axtarış (hərf registrindən asılı deyil). */
  @IsOptional() @IsString() @Length(1, 120) q?: string;

  /** `true`/`false` — yalnız təsdiqlənmiş (və ya təsdiqlənməmiş) mağazalar. */
  @IsOptional() @IsBooleanString() verified?: string;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(50) limit?: number;
}
