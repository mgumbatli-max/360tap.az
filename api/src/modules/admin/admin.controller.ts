import {
  Body,
  Controller,
  Get,
  Ip,
  Param,
  ParseUUIDPipe,
  Patch,
  Put,
  Query,
  SetMetadata,
} from '@nestjs/common';
import type { UserRole } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ROLES_KEY } from '../../common/guards/roles.guard';
import type { JwtPayload } from '../auth/types/jwt-payload.type';
import { AdminStatsService } from './admin-stats.service';
import { AdminService } from './admin.service';
import { QueryStoresDto } from './dto/query-stores.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { UpdateStoreAdminDto } from './dto/update-store.dto';
import { UpdateUserAdminDto } from './dto/update-user.dto';
import { UpsertCategoryLimitDto } from './dto/upsert-category-limit.dto';

/**
 * ADMİN API — operatorun bütün idarəetmə səthi.
 *
 * NİYƏ SİNİF SƏVİYYƏSİNDƏ `@Roles`: rol yoxlamasını hər metoda ayrıca yazsaq,
 * gec-tez biri unudulacaq və qorunmamış admin route-u yaranacaq. RolesGuard
 * metadata-nı həm handler, həm sinif üzərindən oxuyur (getAllAndOverride),
 * ona görə buradakı bir dekorator BÜTÜN route-lara şamil olunur.
 * JWT tələbi isə qlobal JwtAuthGuard-dandır — burada `@Public()` YOXDUR.
 *
 * `Roles(...)` helper-i `MethodDecorator` kimi tiplənib (yalnız metoda qoyulur),
 * ona görə sinif üçün eyni metadata açarı birbaşa yazılır — guard onsuz da
 * handler və sinifi eyni açarla oxuyur.
 */
const ADMIN_ROLES: UserRole[] = ['admin', 'super_admin'];

@SetMetadata(ROLES_KEY, ADMIN_ROLES)
@Controller('admin')
export class AdminController {
  constructor(
    private readonly admin: AdminService,
    private readonly stats: AdminStatsService,
  ) {}

  // ─── Ayarlar (monetizasiyanın ana açarı) ───
  @Get('settings')
  settings() {
    return this.admin.listSettings();
  }

  @Patch('settings/:key')
  updateSetting(
    @Param('key') key: string,
    @Body() dto: UpdateSettingDto,
    @CurrentUser() user: JwtPayload,
    @Ip() ip: string,
  ) {
    return this.admin.updateSetting(key, dto.value, user.sub, ip);
  }

  // ─── Mağazalar ───
  @Get('stores')
  stores(@Query() q: QueryStoresDto) {
    return this.admin.listStores(q);
  }

  @Patch('stores/:id')
  updateStore(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpdateStoreAdminDto,
    @CurrentUser() user: JwtPayload,
    @Ip() ip: string,
  ) {
    return this.admin.updateStore(id, dto, user.sub, ip);
  }

  // ─── İstifadəçilər ───
  @Get('users')
  users(@Query() q: QueryUsersDto) {
    return this.admin.listUsers(q);
  }

  @Patch('users/:id')
  updateUser(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpdateUserAdminDto,
    @CurrentUser() user: JwtPayload,
    @Ip() ip: string,
  ) {
    return this.admin.updateUser(id, dto, { id: user.sub, role: user.role }, ip);
  }

  // ─── Kateqoriya limitləri ───
  @Get('category-limits')
  categoryLimits() {
    return this.admin.listCategoryLimits();
  }

  @Put('category-limits/:categoryId')
  upsertCategoryLimit(
    @Param('categoryId', new ParseUUIDPipe({ version: '4' })) categoryId: string,
    @Body() dto: UpsertCategoryLimitDto,
    @CurrentUser() user: JwtPayload,
    @Ip() ip: string,
  ) {
    return this.admin.upsertCategoryLimit(categoryId, dto, user.sub, ip);
  }

  // ─── Xülasə ───
  @Get('stats')
  summary() {
    return this.stats.summary();
  }
}
