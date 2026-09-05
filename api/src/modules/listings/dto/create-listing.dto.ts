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
  registerDecorator,
  type ValidationOptions,
} from 'class-validator';
import { Condition, PriceType } from '@prisma/client';

const CURRENCY_RE = /^(AZN|USD|EUR|RUB)$/;
const PHONE_RE = /^\+?\d{9,15}$/;

/** Bir elanda göndərilə bilən atribut açarlarının yuxarı həddi. */
export const MAX_ATTRIBUTE_KEYS = 40;

/**
 * Atribut açarlarının sayına hədd qoyur.
 * Tanınmayan açarlar servisdə səssizcə atılır, amma atılmadan ƏVVƏL hər açar
 * parse olunur və yaddaşda saxlanılır — minlərlə açarlı JSON ilə sorğu yolunu
 * yükləmək mümkün olardı. Ən "zəngin" kateqoriyada cəmi 14 atribut var,
 * ona görə 40 bol ehtiyatdır və real istifadəçini heç vaxt bloklamır.
 */
function MaxKeys(max: number, options?: ValidationOptions) {
  return (object: object, propertyName: string): void => {
    registerDecorator({
      name: 'maxKeys',
      target: object.constructor,
      propertyName,
      options,
      validator: {
        validate(value: unknown): boolean {
          if (value === null || typeof value !== 'object' || Array.isArray(value)) return true;
          return Object.keys(value).length <= max;
        },
        defaultMessage: () => `Ən çox ${max} atribut göndərmək olar`,
      },
    });
  };
}

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

  /** Köhnə (üstündən xətt çəkilən) qiymət — endirim göstərmək üçün. */
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0, { message: 'Köhnə qiymət mənfi ola bilməz' })
  @Max(99_999_999_999.99, { message: 'Köhnə qiymət çox yüksəkdir' })
  oldPrice?: number;

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
  // Burada yalnız formanın "obyektdir və çox böyük deyil" yoxlaması gedir.
  // Açar/dəyər uyğunluğu kateqoriyadan asılıdır, ona görə məzmun servisdə
  // (category_attributes sətirlərinə görə) təmizlənir.
  @IsOptional()
  @IsObject({ message: 'Atributlar obyekt formatında olmalıdır' })
  @MaxKeys(MAX_ATTRIBUTE_KEYS)
  attributes?: Record<string, unknown>;

  // ----- Bayraqlar -----
  @IsOptional() @IsBoolean() hasDelivery?: boolean;
  @IsOptional() @IsBoolean() hasCredit?: boolean;
  @IsOptional() @IsBoolean() hasBarter?: boolean;
  // `hasWarranty` və `inStock` DTO-da YOX İDİ, halbuki Prisma modeli onları saxlayır
  // və cavab DTO-su qaytarırdı. `forbidNonWhitelisted: true` olduğu üçün bu sahələri
  // göndərən sorğu 422 alırdı — yəni satıcı zəmanət/stok məlumatını HEÇ VAXT təyin
  // edə bilmirdi, elan səhifəsi isə onları «yox» kimi göstərirdi.
  @IsOptional() @IsBoolean() hasWarranty?: boolean;
  @IsOptional() @IsBoolean() inStock?: boolean;

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
