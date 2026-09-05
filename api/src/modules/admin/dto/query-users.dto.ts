import { Type } from 'class-transformer';
import { UserRole, UserStatus } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, IsString, Length, Max, Min } from 'class-validator';

export class QueryUsersDto {
  /** Ad, e-poçt və ya telefon üzrə axtarış. */
  @IsOptional() @IsString() @Length(1, 120) q?: string;

  @IsOptional() @IsEnum(UserRole) role?: UserRole;
  @IsOptional() @IsEnum(UserStatus) status?: UserStatus;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(50) limit?: number;
}
