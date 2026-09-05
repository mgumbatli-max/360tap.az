import {
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
} from 'class-validator';
import { PHONE_RE } from './create-store.dto';

/**
 * Filial = mağazanın fiziki nöqtəsi (`StoreBranch` modeli).
 * Sahələr sxemlə birebir uyğundur: name, address, districtId?, lat?, lng?, phone?.
 */
export class CreateStoreBranchDto {
  @IsString()
  @Length(2, 120, { message: 'Filial adı 2-120 simvol olmalıdır' })
  name!: string;

  @IsString()
  @Length(5, 500, { message: 'Ünvan 5-500 simvol olmalıdır' })
  address!: string;

  @IsOptional() @IsUUID('4', { message: 'Rayon identifikatoru yanlışdır' }) districtId?: string;
  @IsOptional() @IsLatitude({ message: 'Latitude yanlışdır' }) lat?: number;
  @IsOptional() @IsLongitude({ message: 'Longitude yanlışdır' }) lng?: number;
  @IsOptional() @Matches(PHONE_RE, { message: 'Telefon nömrəsi yanlışdır' }) phone?: string;
}

/**
 * Redaktədə `null` = "sahəni təmizlə" (məs. səhv salınmış koordinatı sil).
 * `name`/`address` isə modeldə NOT NULL-dur — onları yalnız dəyişmək olar, silmək yox.
 */
export class UpdateStoreBranchDto {
  @IsOptional() @IsString() @Length(2, 120) name?: string;
  @IsOptional() @IsString() @Length(5, 500) address?: string;

  @IsOptional() @IsUUID('4', { message: 'Rayon identifikatoru yanlışdır' }) districtId?: string | null;
  @IsOptional() @IsLatitude({ message: 'Latitude yanlışdır' }) lat?: number | null;
  @IsOptional() @IsLongitude({ message: 'Longitude yanlışdır' }) lng?: number | null;
  @IsOptional() @Matches(PHONE_RE, { message: 'Telefon nömrəsi yanlışdır' }) phone?: string | null;
}
