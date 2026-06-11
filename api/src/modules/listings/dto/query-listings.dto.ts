import { ListingSource } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class QueryListingsDto {
  @IsOptional() @IsString() q?: string; // ani keyword axtarış (title/description)
  @IsOptional() @IsString() region?: string; // region slug
  @IsOptional() @IsUUID('4') district?: string; // district id
  @IsOptional() @IsString() category?: string; // category slug
  @IsOptional() @IsString() vertical?: string;
  // Kateqoriya-spesifik atribut filtrləri: JSON string {"brand":"Apple","fuel":"Benzin"}
  @IsOptional() @IsString() attrs?: string;
  @IsOptional() @IsEnum(ListingSource) source?: ListingSource;

  @IsOptional() @Type(() => Number) @IsNumber() priceMin?: number;
  @IsOptional() @Type(() => Number) @IsNumber() priceMax?: number;

  @IsOptional()
  @IsIn(['new', 'price_asc', 'price_desc', 'popular'])
  sort?: 'new' | 'price_asc' | 'price_desc' | 'popular';

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  // limit > 50 rədd edilmir — service Math.min(limit, 50) ilə clamp edir (böyük səhifələmə qırılmasın)
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) limit?: number;
}
