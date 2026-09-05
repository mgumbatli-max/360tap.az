import { Global, Module } from '@nestjs/common';
import { SettingsService } from './settings.service';

/**
 * @Global — bayraqlar elan yaratma, mağaza qeydiyyatı, paket vitrini və admin
 * panelindən oxunur. Hər modulda import etmək əvəzinə bir dəfə qlobal verilir
 * (Prisma və Messaging modulları ilə eyni üslub).
 */
@Global()
@Module({
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
