import { IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export const REPORT_REASONS = [
  'spam',
  'fraud',
  'prohibited',
  'wrong_category',
  'duplicate',
  'offensive',
  'other',
] as const;

export class CreateReportDto {
  @IsOptional() @IsUUID('4') listingId?: string;
  @IsOptional() @IsUUID('4') userId?: string;
  @IsIn(REPORT_REASONS) reason!: string;
  @IsOptional() @IsString() @MaxLength(1000) detail?: string;
}
