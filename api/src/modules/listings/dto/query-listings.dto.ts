import { ListingSource } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

/**
 * «1» / «true» → true. Query string-də hər şey mətndir, `@IsBoolean` isə xam
 * `'1'`-i rədd edərdi (422). Sürətli filtr çipləri URL-ə məhz `?hasDelivery=1`
 * yazır, ona görə çevrilmə burada edilir.
 */
const toBool = ({ value }: { value: unknown }): boolean | undefined => {
  if (typeof value === 'boolean') return value;
  if (value === '1' || value === 'true') return true;
  if (value === '0' || value === 'false') return false;
  return undefined;
};

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

  /**
   * SÜRƏTLİ FİLTRLƏR (ana səhifədəki çiplər).
   *
   * Əvvəl bu çiplər backend-də MÖVCUD OLMAYAN parametrlər göndərirdi
   * (`has_delivery=1`, `sort=vip`, `with_photo=1`, `verified=1`) və hamısı 422
   * verirdi — istifadəçi düyməyə basıb «elan tapılmadı» görürdü.
   *
   * NİYƏ `sort` DEYİL, FİLTR: «VIP» və «Çatdırılma var» sıralama deyil, SEÇİMDİR —
   * istifadəçi yalnız o elanları görmək istəyir. Sıralama dəyəri kimi qurulsaydı
   * nəticəyə uyğun olmayan elanlar da düşərdi.
   *
   * NİYƏ YALNIZ `true` TƏTBİQ OLUNUR: `false` «çatdırılması OLMAYANLAR» demək olardı,
   * amma çip yalnız iki vəziyyət bilir — seçilib/seçilməyib. Seçilməyəndə parametr
   * ümumiyyətlə göndərilmir; `false` gəlsə də filtr tətbiq edilmir ki, davranış
   * gözləniləndən kənara çıxmasın.
   */
  @IsOptional() @Transform(toBool) @IsBoolean() hasDelivery?: boolean;
  @IsOptional() @Transform(toBool) @IsBoolean() withPhoto?: boolean;
  @IsOptional() @Transform(toBool) @IsBoolean() vip?: boolean;
  @IsOptional() @Transform(toBool) @IsBoolean() hasCredit?: boolean;
  @IsOptional() @Transform(toBool) @IsBoolean() hasBarter?: boolean;
  /**
   * `onlyShops` və `verified` FƏRQLİ filtrlərdir:
   *  · onlyShops — elan hər hansı mağazaya bağlıdır (fərdi satıcı deyil)
   *  · verified  — həmin mağaza TƏSDİQLƏNİB
   * Ölçüldü: mağazadan 3 elan, təsdiqli mağazadan 2 — birini digərinin yerinə
   * işlətmək nəticəni səssizcə dəyişər.
   */
  @IsOptional() @Transform(toBool) @IsBoolean() onlyShops?: boolean;
  @IsOptional() @Transform(toBool) @IsBoolean() verified?: boolean;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  // limit > 50 rədd edilmir — service Math.min(limit, 50) ilə clamp edir (böyük səhifələmə qırılmasın)
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) limit?: number;
}
