import { IsOptional, IsString, Length, Matches } from 'class-validator';

export class VerifyOtpDto {
  @IsString()
  @Length(7, 20)
  phone!: string;

  @IsString()
  @Matches(/^\d{6}$/, { message: 'Kod 6 rəqəmdən ibarətdir' })
  code!: string;

  /** Yalnız YENİ hesab yaradılarkən işlədilir; mövcud istifadəçidə nəzərə alınmır. */
  @IsOptional()
  @IsString()
  @Length(2, 120, { message: 'Ad 2-120 simvol arasında olmalıdır' })
  fullName?: string;
}
