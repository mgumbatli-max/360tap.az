import { Type } from 'class-transformer';
import { IsOptional, IsString, IsUrl, Length, Matches, ValidateNested } from 'class-validator';
import { PHONE_RE } from './create-store.dto';
import { WorkingHoursDto } from './working-hours.dto';

/**
 * `PATCH /me/store` gövdəsi.
 *
 * NİYƏ `null` icazəlidir: sahibi yüklədiyi loqonu və ya yazdığı çatdırılma
 * şərtini GERİ GÖTÜRƏ bilməlidir. `undefined` (sahə göndərilməyib) = "toxunma",
 * `null` = "sil". `@IsOptional()` hər ikisini validasiyadan keçirir, fərqi isə
 * servis qatı ayırd edir.
 *
 * `name`/`slug` QƏSDƏN yoxdur: slug mağaza adından törəyir və public URL-dir —
 * onu sərbəst dəyişmək köhnə linkləri qırar. Ad dəyişikliyi ayrıca (admin
 * nəzarətli) axın olmalıdır.
 */
export class UpdateStoreDto {
  // Şəkillər `POST /api/v1/media/upload` cavabındakı mütləq URL-dir.
  // `require_tld: false` — lokal/daxili host (localhost, render daxili ad) da keçsin
  // (elan şəkilləri ilə eyni qayda: listings/dto/create-listing.dto.ts).
  @IsOptional()
  @IsUrl({ require_tld: false }, { message: 'Loqo URL formatı yanlışdır' })
  logoUrl?: string | null;

  @IsOptional()
  @IsUrl({ require_tld: false }, { message: 'Örtük şəkli URL formatı yanlışdır' })
  coverUrl?: string | null;

  @IsOptional() @IsString() @Length(0, 2000) description?: string | null;

  @IsOptional() @Matches(PHONE_RE, { message: 'Telefon nömrəsi yanlışdır' }) phone?: string | null;
  @IsOptional() @Matches(PHONE_RE, { message: 'WhatsApp nömrəsi yanlışdır' }) whatsapp?: string | null;
  @IsOptional() @IsString() @Length(0, 80) instagram?: string | null;

  @IsOptional()
  @ValidateNested()
  @Type(() => WorkingHoursDto)
  workingHours?: WorkingHoursDto | null;

  @IsOptional() @IsString() @Length(0, 2000) deliveryTerms?: string | null;
  @IsOptional() @IsString() @Length(0, 2000) warrantyTerms?: string | null;
}
