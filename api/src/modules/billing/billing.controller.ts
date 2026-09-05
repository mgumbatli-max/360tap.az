import { Controller, Get, Query } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import type { JwtPayload } from '../auth/types/jwt-payload.type';
import type { MeSubscriptionResponse, PackageResponse } from './dto/billing-response.dto';
import { ListingLimitsQueryDto } from './dto/query-billing.dto';
import type { ListingLimitOverview } from './listing-limit.service';
import { ListingLimitService } from './listing-limit.service';
import { PackagesService } from './packages.service';
import { SubscriptionsService } from './subscriptions.service';

/**
 * İctimai vitrin + istifadəçinin öz billing vəziyyəti.
 * Prefiks yoxdur, çünki yollar müxtəlif köklərdədir (`packages`, `me/...`) —
 * StoresController ilə eyni üslub.
 */
@Controller()
export class BillingController {
  constructor(
    private readonly packages: PackagesService,
    private readonly subscriptions: SubscriptionsService,
    private readonly listingLimits: ListingLimitService,
  ) {}

  /**
   * Paket vitrini. `packages.enabled` (və ya ümumi `monetization.enabled`)
   * bağlı olduqda BOŞ massiv qaytarır — xəta yox: satış hələ açılmayıb, ona görə
   * heç bir yerdə qiymət görünməməlidir.
   */
  @Public()
  @Get('packages')
  listPublic(): Promise<PackageResponse[]> {
    return this.packages.listPublic();
  }

  /** İstifadəçinin aktiv abunəsi; yoxdursa `null` (xəta deyil). */
  @Get('me/subscription')
  mySubscription(@CurrentUser() user: JwtPayload): Promise<MeSubscriptionResponse | null> {
    return this.subscriptions.findActive(user.sub);
  }

  /**
   * Öz elan limiti. Bayraqlar bağlı olduqda da rəqəm qaytarılır (`blocked:false`) —
   * istifadəçi vəziyyətini görür, amma heç nə bloklanmır.
   */
  @Get('me/listing-limits')
  myListingLimits(
    @CurrentUser() user: JwtPayload,
    @Query() query: ListingLimitsQueryDto,
  ): Promise<ListingLimitOverview> {
    return this.listingLimits.overview(user.sub, query.categoryId);
  }
}
