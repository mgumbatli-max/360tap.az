import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsLatitude,
  IsLongitude,
  IsNumber,
  IsObject,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  IsUrl,
  Length,
  Matches,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Condition, PriceType } from '@prisma/client';

const CURRENCY_RE = /^(AZN|USD|EUR|RUB)$/;
const PHONE_RE = /^\+?\d{9,15}$/;

export class ListingImageDto {
  @IsUrl({ require_tld: false }, { message: 'URL formatı yanlışdır' })
  url!: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  width?: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  height?: number;

  @IsOptional()
  @IsString()
  @Length(20, 60)
  blurHash?: string;
}

export class CreateListingDto {
  @IsString()
  @Length(10, 120, { message: 'Başlıq 10-120 simvol arasında olmalıdır' })
  title!: string;

  @IsString()
  @Length(20, 5000, { message: 'Təsvir 20-5000 simvol arasında olmalıdır' })
  description!: string;

  @IsUUID('4', { message: 'Kateqoriya ID yanlış UUID formatındadır' })
  categoryId!: string;

  @IsOptional()
  @IsUUID('4')
  districtId?: string;

  // ----- Qiymət -----
  // `@Min(0)` YOX İDİ: yuxarı hədd qoyulmuşdu, aşağı hədd qoyulmamışdı, ona görə
  // mənfi qiymət qəbul olunurdu (bazada -777000 və -500000 kimi sətirlər var).
  // Mənfi qiymət "ucuzdan bahaya" sıralamasının başına düşür və vitrini korlayır.
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0, { message: 'Qiymət mənfi ola bilməz' })
  @Max(99_999_999_999.99, { message: 'Qiymət çox yüksəkdir' })
  price?: number;

  @IsOptional()
  @Matches(CURRENCY_RE, { message: 'Valyuta yalnız AZN/USD/EUR/RUB ola bilər' })
  currency?: string;

  @IsOptional()
  @IsEnum(PriceType, { message: 'Qiymət növü yanlışdır' })
  priceType?: PriceType;

  @IsOptional()
  @IsEnum(Condition, { message: 'Vəziyyət yanlışdır' })
  condition?: Condition;

  // ----- Dinamik atributlar (kateqoriyaya görə) -----
  @IsOptional()
  @IsObject()
  attributes?: Record<string, unknown>;

  // ----- Bayraqlar -----
  @IsOptional() @IsBoolean() hasDelivery?: boolean;
  @IsOptional() @IsBoolean() hasCredit?: boolean;
  @IsOptional() @IsBoolean() hasBarter?: boolean;

  // ----- Əlaqə -----
  @IsOptional()
  @IsString()
  @Length(2, 120)
  contactName?: string;

  @IsOptional()
  @Matches(PHONE_RE, { message: 'Telefon nömrəsi yanlışdır' })
  contactPhone?: string;

  @IsOptional() @IsBoolean() contactWhatsapp?: boolean;

  // ----- Məkan -----
  @IsOptional()
  @IsString()
  @Length(0, 500)
  address?: string;

  @IsOptional()
  @IsLatitude({ message: 'Latitude yanlışdır' })
  lat?: number;

  @IsOptional()
  @IsLongitude({ message: 'Longitude yanlışdır' })
  lng?: number;

  // ----- Şəkillər -----
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20, { message: 'Maksimum 20 şəkil' })
  @ValidateNested({ each: true })
  @Type(() => ListingImageDto)
  images?: ListingImageDto[];
}
