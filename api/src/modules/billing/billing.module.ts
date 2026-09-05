import { Module } from '@nestjs/common';
import { AuditService } from './audit.service';
import { BillingAdminController } from './billing-admin.controller';
import { BillingController } from './billing.controller';
import { ListingLimitService } from './listing-limit.service';
import { PackagesService } from './packages.service';
import { PaymentsService } from './payments.service';
import { SubscriptionsService } from './subscriptions.service';

/**
 * MONETİZASİYA TƏMƏLİ — qurulub, amma SÖNÜLÜ.
 *
 * Modul paketləri, abunələri və elan limiti mühərrikini saxlayır. Başlanğıc
 * siyasəti: bütün bayraqlar (`monetization.enabled`, `packages.enabled`,
 * `listing_limits.enabled`) bağlıdır — kod hazır dayanır, heç kimi bloklamır və
 * heç bir yerdə qiymət göstərmir. Astana keçiləndə admin bayraqları açır.
 *
 * `SettingsService` @Global-dır (SettingsModule) — burada import tələb olunmur.
 *
 * `ListingLimitService` EXPORT olunur: elan yaratma axını (`listings.service`)
 * onu inject edərək `check()` çağıracaq. Qoşulma qəsdən burada edilmir —
 * `listings` modulu başqa iş bölgüsünə aiddir.
 */
@Module({
  controllers: [BillingController, BillingAdminController],
  providers: [
    AuditService,
    PackagesService,
    SubscriptionsService,
    PaymentsService,
    ListingLimitService,
  ],
  exports: [ListingLimitService],
})
export class BillingModule {}
