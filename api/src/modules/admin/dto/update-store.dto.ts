import { StoreStatus } from '@prisma/client';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';

/**
 * «Qırıq halqa 2 və 3»-ün bağlandığı yer: `status` və `isVerified` sahələrini
 * platformada yazan yeganə endpoint budur.
 */
export class UpdateStoreAdminDto {
  @IsOptional() @IsEnum(StoreStatus, { message: 'status: pending | active | suspended' })
  status?: StoreStatus;

  @IsOptional() @IsBoolean() isVerified?: boolean;
}
