import { Module } from '@nestjs/common';
import { ListingsModule } from '../listings/listings.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ExpiryAlertsService } from './expiry.service';
import { SavedSearchAlertsService } from './saved-search.service';

/**
 * BİLDİRİŞ TETİKLƏYİCİLƏRİ — periodik mənbələr bir yerdə.
 *
 * NİYƏ AYRICA MODUL: bildiriş yaradan məntiqi mövcud modullara (listings, favorites,
 * saved-searches) səpələmək onları şişirdər və hər dəyişiklikdə əsas sorğu yollarına
 * toxunmaq deməkdir. Burada isə bütün cron mənbələri bir yerdədir və mövcud modullar
 * yalnız OXUNUR (`ListingsService.findAll`), dəyişdirilmir.
 *
 * Hadisə əsaslı yeganə mənbə (sevimli elanın statusu dəyişdi) bura DAXİL DEYİL —
 * o, `listings.service.ts` daxilində baş verir, çünki status dəyişikliyi məhz orada
 * bilinir və köhnə status onsuz da oxunur.
 */
@Module({
  imports: [ListingsModule, NotificationsModule],
  providers: [SavedSearchAlertsService, ExpiryAlertsService],
  exports: [SavedSearchAlertsService, ExpiryAlertsService],
})
export class AlertsModule {}
