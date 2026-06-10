import {
  IsEmail,
  IsOptional,
  IsString,
  Length,
  Matches,
  MinLength,
  ValidateIf,
} from 'class-validator';

const PHONE_RE = /^\+?\d{9,15}$/;
const PASSWORD_RE = /^(?=.*[a-zA-Z])(?=.*\d).{8,}$/;

export class RegisterDto {
  @IsString({ message: 'Ad mətn olmalıdır' })
  @Length(2, 120, { message: 'Ad 2-120 simvol arasında olmalıdır' })
  fullName!: string;

  @ValidateIf((o: RegisterDto) => !o.phone)
  @IsEmail({}, { message: 'Email formatı yanlışdır' })
  email?: string;

  @ValidateIf((o: RegisterDto) => !o.email)
  @IsString()
  @Matches(PHONE_RE, { message: 'Telefon nömrəsi yanlışdır (+994... formatı)' })
  phone?: string;

  @IsString()
  @MinLength(8, { message: 'Parol ən azı 8 simvol olmalıdır' })
  @Matches(PASSWORD_RE, {
    message: 'Parol həm hərf, həm rəqəm ehtiva etməlidir',
  })
  password!: string;

  @IsOptional()
  @IsString()
  districtId?: string;
}
