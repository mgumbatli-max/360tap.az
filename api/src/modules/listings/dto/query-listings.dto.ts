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

  // `@Min(0)`: mənfi priceMin xəta vermir, amma nəticəni SƏSSİZ dəyişirdi —
  // `price >= -100` şərti qiyməti NULL olan («razılaşma yolu ilə») elanları kəsirdi,
  // yəni istifadəçi səbəbini görmədən 9 elanı itirirdi. Mənfi qiymət onsuz da
  // create DTO-sunda qadağandır, ona görə filtr üçün də mənasızdır.
  // priceMin > priceMax halı burada 422 kimi rədd EDİLMİR — servisdə hədlər
  // yerbəyer edilir (paylaşılmış köhnə linklər sınmasın).
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) priceMin?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) priceMax?: number;

  @IsOptional()
  @IsIn(['new', 'price_asc', 'price_desc', 'popular'])
  sort?: 'new' | 'price_asc' | 'price_desc' | 'popular';

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  // limit > 50 rədd edilmir — service Math.min(limit, 50) ilə clamp edir (böyük səhifələmə qırılmasın)
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) limit?: number;
}
