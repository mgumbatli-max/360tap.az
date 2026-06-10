import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { CreateListingDto } from './dto/create-listing.dto';
import type { ListingResponse } from './dto/listing-response.dto';
import { QueryListingsDto } from './dto/query-listings.dto';
import { ListingsService } from './listings.service';
import type { JwtPayload } from '../auth/types/jwt-payload.type';

@Controller('listings')
export class ListingsController {
  constructor(private readonly listings: ListingsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateListingDto,
  ): Promise<ListingResponse> {
    return this.listings.create(user.sub, dto);
  }

  @Public()
  @Get()
  findAll(@Query() query: QueryListingsDto) {
    return this.listings.findAll(query);
  }

  @Public()
  @Get(':id')
  async getById(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<ListingResponse> {
    const listing = await this.listings.findById(id);
    if (!listing) throw new NotFoundException('Elan tapılmadı');
    return listing;
  }

  @Get('me/list')
  listMine(@CurrentUser() user: JwtPayload): Promise<ListingResponse[]> {
    return this.listings.listByOwner(user.sub);
  }
}
