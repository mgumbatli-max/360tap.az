import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  Matches,
  Min,
  ValidateNested,
} from 'class-validator';

const PHONE_RE = /^\+?\d{9,15}$/;

export class ErpStoreDto {
  @IsOptional() @IsString() @Length(0, 120) branch?: string;
  @IsOptional() @IsString() @Length(0, 500) address?: string;
  @IsOptional() @IsString() region?: string; // region slug
  @IsOptional() @IsString() district?: string; // district slug
  @IsOptional() @Type(() => Number) @IsNumber() lat?: number;
  @IsOptional() @Type(() => Number) @IsNumber() lng?: number;
}

export class ErpPublishDto {
  @IsString() @Length(1, 120) external_id!: string;
  @IsString() @Length(3, 140) title!: string;
  @IsString() @Length(1, 120) category!: string; // marketplace kateqoriya slug
  @IsString() @Length(10, 5000) description!: string;

  @IsOptional() @IsString() region?: string; // region slug
  @IsOptional() @IsString() district?: string; // district slug
  @IsOptional() @IsString() @Length(1, 120) subcategory?: string;
  @IsOptional() @IsString() @Length(0, 80) brand?: string;
  @IsOptional() @IsString() @Length(0, 120) model?: string;

  @IsOptional() @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) price?: number;
  @IsOptional() @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) old_price?: number;
  @IsOptional() @Matches(/^(AZN|USD|EUR|RUB)$/) currency?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) stock_qty?: number;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20, { message: 'Maksimum 20 şəkil' })
  @IsUrl(
    { require_tld: false, protocols: ['http', 'https'], require_protocol: true },
    { each: true, message: 'Şəkil URL formatı yanlışdır (yalnız http/https)' },
  )
  images?: string[];

  @IsOptional() @IsObject() attributes?: Record<string, unknown>;

  @IsOptional() @IsBoolean() delivery?: boolean;
  @IsOptional() @IsBoolean() credit?: boolean;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) warranty_months?: number;
  @IsOptional() @Matches(PHONE_RE) whatsapp?: string;

  // Kontrakt sahələri (docs/v2/08) — qəbul olunur ki, real ERP 422 almasın
  @IsOptional() @IsArray() @IsString({ each: true }) payment?: string[];
  @IsOptional() @IsString() @Length(0, 30) seller_type?: string;
  @IsOptional() @IsBoolean() active?: boolean;

  @IsOptional() @ValidateNested() @Type(() => ErpStoreDto) store?: ErpStoreDto;
}
