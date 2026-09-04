import { IsString, Length, Matches, MinLength } from 'class-validator';

const PASSWORD_RE = /^(?=.*[a-zA-Z])(?=.*\d).{8,}$/;

export class ResetPasswordDto {
  @IsString()
  @Length(40, 200)
  token!: string;

  @IsString()
  @MinLength(8, { message: 'Parol ən azı 8 simvol olmalıdır' })
  @Matches(PASSWORD_RE, { message: 'Parol həm hərf, həm rəqəm ehtiva etməlidir' })
  password!: string;
}
