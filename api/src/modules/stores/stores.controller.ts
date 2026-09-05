import {
  Body,
  Controller,
  Delete,
  Get,
  Ip,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import type { JwtPayload } from '../auth/types/jwt-payload.type';
import { CreateStoreDto } from './dto/create-store.dto';
import { QueryStoresDto } from './dto/query-stores.dto';
import { CreateStoreBranchDto, UpdateStoreBranchDto } from './dto/store-branch.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { StoresService } from './stores.service';

class StoreListingsQuery {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(50) limit?: number;
}

/**
 * `/me/store*` yolları qlobal `JwtAuthGuard` altındadır (`@Public` yoxdur) və
 * mağazanı HƏMİŞƏ JWT-dəki `sub`-dan tapır — yol parametri kimi mağaza id-si
 * heç bir sahib əməliyyatında qəbul edilmir (IDOR).
 *
 * `@Ip()` audit sətrinə yazılır; dəyər `trust proxy` ayarına uyğun gəlir
 * (main.ts + app.module.ts — saxtalaşdırıla bilməyən hop hesablanır).
 */
@Controller()
export class StoresController {
  constructor(private readonly stores: StoresService) {}

  // ---- Mağaza sahibi ----

  @Post('me/store')
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateStoreDto, @Ip() ip: string) {
    return this.stores.create(user.sub, dto, ip);
  }

  @Get('me/store')
  mine(@CurrentUser() user: JwtPayload) {
    return this.stores.getMine(user.sub);
  }

  @Patch('me/store')
  update(@CurrentUser() user: JwtPayload, @Body() dto: UpdateStoreDto, @Ip() ip: string) {
    return this.stores.updateMine(user.sub, dto, ip);
  }

  // ---- Filiallar ----

  @Get('me/store/branches')
  branches(@CurrentUser() user: JwtPayload) {
    return this.stores.listBranches(user.sub);
  }

  @Post('me/store/branches')
  createBranch(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateStoreBranchDto,
    @Ip() ip: string,
  ) {
    return this.stores.createBranch(user.sub, dto, ip);
  }

  @Patch('me/store/branches/:id')
  updateBranch(
    @CurrentUser() user: JwtPayload,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpdateStoreBranchDto,
    @Ip() ip: string,
  ) {
    return this.stores.updateBranch(user.sub, id, dto, ip);
  }

  @Delete('me/store/branches/:id')
  deleteBranch(
    @CurrentUser() user: JwtPayload,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Ip() ip: string,
  ) {
    return this.stores.deleteBranch(user.sub, id, ip);
  }

  // ---- İctimai ----

  @Public()
  @Get('stores')
  catalog(@Query() q: QueryStoresDto) {
    return this.stores.findAll(q);
  }

  @Public()
  @Get('stores/:slug')
  get(@Param('slug') slug: string) {
    return this.stores.getBySlug(slug);
  }

  @Public()
  @Get('stores/:slug/listings')
  listings(@Param('slug') slug: string, @Query() q: StoreListingsQuery) {
    return this.stores.getListings(slug, q);
  }
}
