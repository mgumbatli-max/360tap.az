import { IsString, Length } from 'class-validator';

export class SendOtpDto {
  /**
   * Xam nömrə — istifadəçi 0501234567 / +994501234567 / (050) 123-45-67 yaza bilər.
   * Formatın özü servisdə `normalizePhone` ilə yoxlanır (tək həqiqət mənbəyi orada),
   * burada yalnız kobud ölçü nəzarəti var.
   */
  @IsString()
  @Length(7, 20)
  phone!: string;
}
