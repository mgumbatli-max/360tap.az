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
  Max,
  Min,
} from 'class-validator';

export class QueryListingsDto {
  @IsOptional() @IsString() region?: string; // region slug
  @IsOptional() @IsUUID('4') district?: string; // district id
  @IsOptional() @IsString() category?: string; // category slug
  @IsOptional() @IsString() vertical?: string;
  @IsOptional() @IsEnum(ListingSource) source?: ListingSource;

  @IsOptional() @Type(() => Number) @IsNumber() priceMin?: number;
  @IsOptional() @Type(() => Number) @IsNumber() priceMax?: number;

  @IsOptional() @IsIn(['new', 'price_asc', 'price_desc']) sort?: 'new' | 'price_asc' | 'price_desc';

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(50) limit?: number;
}
