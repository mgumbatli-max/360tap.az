import { UserRole, UserStatus } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';

export class UpdateUserAdminDto {
  @IsOptional() @IsEnum(UserRole) role?: UserRole;
  @IsOptional() @IsEnum(UserStatus) status?: UserStatus;
}
