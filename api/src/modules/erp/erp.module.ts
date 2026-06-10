import { Module } from '@nestjs/common';
import { ErpAuthGuard } from './erp-auth.guard';
import { ErpController } from './erp.controller';
import { ErpService } from './erp.service';

@Module({
  controllers: [ErpController],
  providers: [ErpService, ErpAuthGuard],
  exports: [ErpService],
})
export class ErpModule {}
