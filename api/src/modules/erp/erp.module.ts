import { Module } from '@nestjs/common';
import { SearchModule } from '../../search/search.module';
import { ErpAuthGuard } from './erp-auth.guard';
import { ErpController } from './erp.controller';
import { ErpService } from './erp.service';

@Module({
  imports: [SearchModule],
  controllers: [ErpController],
  providers: [ErpService, ErpAuthGuard],
  exports: [ErpService],
})
export class ErpModule {}
