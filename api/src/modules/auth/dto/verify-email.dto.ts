import { IsString, Length } from 'class-validator';

export class VerifyEmailDto {
  /** `<sətir id>.<32 baytlıq sirr>` — linkdən gəlir. */
  @IsString()
  @Length(40, 200)
  token!: string;
}
