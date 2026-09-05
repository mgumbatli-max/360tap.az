import { BillingModule } from '../billing/billing.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { Module } from '@nestjs/common';
import { SearchModule } from '../../search/search.module';
import { CategoriesModule } from '../categories/categories.module';
import { ListingsController } from './listings.controller';
import { ListingsService } from './listings.service';

@Module({
  imports: [CategoriesModule, SearchModule, BillingModule, NotificationsModule],
  controllers: [ListingsController],
  providers: [ListingsService],
  exports: [ListingsService],
})
export class ListingsModule {}
