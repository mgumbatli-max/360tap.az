import { IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';

export class CreateReviewDto {
  @IsUUID('4') reviewedId!: string; // rəy yazılan istifadəçi (satıcı)
  @IsOptional() @IsUUID('4') listingId?: string;
  @IsInt() @Min(1) @Max(5) rating!: number;
  @IsOptional() @IsString() @MaxLength(1000) comment?: string;
}
