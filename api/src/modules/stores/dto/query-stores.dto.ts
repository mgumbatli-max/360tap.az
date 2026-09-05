import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, Length, Max, Min } from 'class-validator';

/**
 * `GET /stores` — ictimai mağaza kataloqu.
 * Qlobal ValidationPipe-da `enableImplicitConversion` SÖNÜLÜDÜR, ona görə query
 * sətirləri açıq şəkildə çevrilir (layihədəki digər query DTO-ları ilə eyni üslub).
 */
export class QueryStoresDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(50) limit?: number;

  /** Ad üzrə axtarış (hərf registrindən asılı deyil). */
  @IsOptional() @IsString() @Length(2, 80) q?: string;

  /**
   * `?verified=true` → yalnız təsdiq nişanı olan mağazalar.
   * NİYƏ `@Type(() => Boolean)` DEYİL: o, "false" sətrini `true`-ya çevirərdi
   * (boş olmayan hər sətir truthy-dir) — filtr səssizcə tərsinə işləyərdi.
   * Tanınmayan dəyər olduğu kimi ötürülür ki, `@IsBoolean()` 422 versin.
   */
  @IsOptional()
  @Transform(({ value }) => (value === 'true' ? true : value === 'false' ? false : value))
  @IsBoolean({ message: 'verified yalnız true və ya false ola bilər' })
  verified?: boolean;
}
