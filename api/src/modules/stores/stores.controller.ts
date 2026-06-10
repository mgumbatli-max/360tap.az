import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import type { JwtPayload } from '../auth/types/jwt-payload.type';
import { CreateStoreDto } from './dto/create-store.dto';
import { StoresService } from './stores.service';

class StoreListingsQuery {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(50) limit?: number;
}

@Controller()
export class StoresController {
  constructor(private readonly stores: StoresService) {}

  // Auth tələb olunur (qlobal JwtAuthGuard)
  @Post('me/store')
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateStoreDto) {
    return this.stores.create(user.sub, dto);
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
