import { IsString, MinLength } from 'class-validator';

export class LoginDto {
  /**
   * Email və ya telefon nömrəsi.
   */
  @IsString()
  @MinLength(3)
  identifier!: string;

  @IsString()
  @MinLength(1)
  password!: string;
}
