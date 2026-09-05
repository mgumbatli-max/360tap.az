import { IsOptional, IsString, Length, Matches } from 'class-validator';

/**
 * Ortaq telefon şablonu — mağaza profilinin həm yaradılmasında, həm redaktəsində,
 * həm də filial nömrəsində eyni qayda işləməlidir (ixrac edilir ki, kopyalanmasın).
 */
export const PHONE_RE = /^\+?\d{9,15}$/;

export class CreateStoreDto {
  @IsString()
  @Length(2, 160, { message: 'Mağaza adı 2-160 simvol olmalıdır' })
  name!: string;

  @IsOptional() @IsString() @Length(0, 2000) description?: string;
  @IsOptional() @Matches(PHONE_RE, { message: 'Telefon nömrəsi yanlışdır' }) phone?: string;
  @IsOptional() @Matches(PHONE_RE, { message: 'WhatsApp nömrəsi yanlışdır' }) whatsapp?: string;
  @IsOptional() @IsString() @Length(0, 80) instagram?: string;
}
