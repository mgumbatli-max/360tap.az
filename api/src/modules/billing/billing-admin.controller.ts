import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Ip,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  SetMetadata,
} from '@nestjs/common';
import type { UserRole } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ROLES_KEY } from '../../common/guards/roles.guard';
import type { JwtPayload } from '../auth/types/jwt-payload.type';
import type { ListMeta } from '../listings/listings.service';
import type {
  AdminPackageResponse,
  AdminSubscriptionResponse,
  PaymentResponse,
} from './dto/billing-response.dto';
import { CreatePackageDto } from './dto/create-package.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { QuerySubscriptionsDto } from './dto/query-billing.dto';
import { UpdatePackageDto } from './dto/update-package.dto';
import { PackagesService } from './packages.service';
import { PaymentsService } from './payments.service';
import { SubscriptionsService } from './subscriptions.service';

const ADMIN_ROLES: UserRole[] = ['admin', 'super_admin'];

/**
 * BÜTÜN BİLLİNQ ADMİN ƏMƏLİYYATLARI.
 *
 * Rol metadata-sı SİNİF səviyyəsindədir (RolesGuard onu `getAllAndOverride` ilə
 * həm handler, həm sinif üzərindən oxuyur). NİYƏ belə: yeni metod əlavə edən
 * `@Roles` yazmağı unutsa belə endpoint açıq qalmır — qorunma «default olaraq
 * bağlı»dır. Eyni üslub AdminController-də də işlədilir.
 *
 * `@Roles(...)` dekoratoru `MethodDecorator` kimi tiplənib, ona görə sinifdə
 * birbaşa `SetMetadata(ROLES_KEY, ...)` çağırılır — məntiq eynidir.
 */
@SetMetadata(ROLES_KEY, ADMIN_ROLES)
@Controller('admin')
export class BillingAdminController {
  constructor(
    private readonly packages: PackagesService,
    private readonly subscriptions: SubscriptionsService,
    private readonly payments: PaymentsService,
  ) {}

  // ──────────────────────────── PAKETLƏR ────────────────────────────

  @Get('packages')
  listPackages(): Promise<AdminPackageResponse[]> {
    return this.packages.listAdmin();
  }

  @Post('packages')
  @HttpCode(HttpStatus.CREATED)
  createPackage(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreatePackageDto,
    @Ip() ip: string,
  ): Promise<AdminPackageResponse> {
    return this.packages.create(dto, { id: user.sub, ip });
  }

  @Patch('packages/:id')
  updatePackage(
    @CurrentUser() user: JwtPayload,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpdatePackageDto,
    @Ip() ip: string,
  ): Promise<AdminPackageResponse> {
    return this.packages.update(id, dto, { id: user.sub, ip });
  }

  /** Abunəsi olan paket SİLİNMİR, deaktiv edilir — cavabda hansı yolun seçildiyi görünür. */
  @Delete('packages/:id')
  deletePackage(
    @CurrentUser() user: JwtPayload,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Ip() ip: string,
  ): Promise<{ id: string; deleted: boolean; deactivated: boolean; subscriptionsCount: number }> {
    return this.packages.remove(id, { id: user.sub, ip });
  }

  // ──────────────────────────── ABUNƏLƏR ────────────────────────────

  @Get('subscriptions')
  listSubscriptions(
    @Query() query: QuerySubscriptionsDto,
  ): Promise<{ data: AdminSubscriptionResponse[]; meta: ListMeta }> {
    return this.subscriptions.listAdmin(query);
  }

  @Post('subscriptions')
  @HttpCode(HttpStatus.CREATED)
  grantSubscription(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateSubscriptionDto,
    @Ip() ip: string,
  ): Promise<AdminSubscriptionResponse> {
    return this.subscriptions.grant(dto, { id: user.sub, ip });
  }

  // ──────────────────────────── ÖDƏNİŞLƏR ───────────────────────────

  @Post('payments')
  @HttpCode(HttpStatus.CREATED)
  recordPayment(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreatePaymentDto,
    @Ip() ip: string,
  ): Promise<PaymentResponse> {
    return this.payments.record(dto, { id: user.sub, ip });
  }
}
