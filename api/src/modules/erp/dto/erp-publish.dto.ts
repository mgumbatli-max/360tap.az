import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Length,
  Matches,
  Min,
} from 'class-validator';

const PHONE_RE = /^\+?\d{9,15}$/;

export class ErpPublishDto {
  @IsString() @Length(1, 120) external_id!: string;
  @IsString() @Length(3, 140) title!: string;
  @IsString() @Length(1, 120) category!: string; // marketplace kateqoriya slug
  @IsString() @Length(10, 5000) description!: string;

  @IsOptional() @IsString() region?: string; // region slug
  @IsOptional() @IsString() district?: string; // district slug

  @IsOptional() @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) price?: number;
  @IsOptional() @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) old_price?: number;
  @IsOptional() @Matches(/^(AZN|USD|EUR|RUB)$/) currency?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) stock_qty?: number;

  @IsOptional() @IsArray() @IsString({ each: true }) images?: string[];
  @IsOptional() @IsObject() attributes?: Record<string, unknown>;

  @IsOptional() @IsBoolean() delivery?: boolean;
  @IsOptional() @IsBoolean() credit?: boolean;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) warranty_months?: number;
  @IsOptional() @Matches(PHONE_RE) whatsapp?: string;
}
