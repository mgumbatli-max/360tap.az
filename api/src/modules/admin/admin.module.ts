import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminStatsService } from './admin-stats.service';
import { AdminService } from './admin.service';
import { AuditService } from './audit.service';

/**
 * SettingsModule @Global olduğuna görə burada import edilmir — SettingsService
 * birbaşa inject olunur (StoresModule ilə eyni üslub).
 * AuditService ixrac olunur: gələcəkdə moderasiya/ödəniş modulları da eyni
 * jurnala yazmalıdır, ikinci audit implementasiyası yaranmasın.
 */
@Module({
  controllers: [AdminController],
  providers: [AdminService, AdminStatsService, AuditService],
  exports: [AuditService],
})
export class AdminModule {}
