import { IsOptional, IsString, IsUUID, Length } from 'class-validator';

export class CreateSubscriptionDto {
  @IsUUID('4', { message: 'userId düzgün UUID olmalıdır' })
  userId!: string;

  @IsUUID('4', { message: 'packageId düzgün UUID olmalıdır' })
  packageId!: string;

  /** Admin qeydi — «niyə pulsuz verildi» sualının cavabı auditdə qalsın. */
  @IsOptional() @IsString() @Length(0, 500) note?: string;
}
