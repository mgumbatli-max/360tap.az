import { IsEmail } from 'class-validator';

export class ForgotPasswordDto {
  @IsEmail({}, { message: 'Email formatı yanlışdır' })
  email!: string;
}
