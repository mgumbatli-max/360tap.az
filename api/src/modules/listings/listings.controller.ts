import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';
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

  @Public()
  @Get(':id/similar')
  similar(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<ListingResponse[]> {
    return this.listings.findSimilar(id);
  }

  @Get('me/list')
  listMine(@CurrentUser() user: JwtPayload): Promise<ListingResponse[]> {
    return this.listings.listByOwner(user.sub);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpdateListingDto,
  ): Promise<ListingResponse> {
    return this.listings.update(user.sub, id, dto);
  }

  @Post(':id/sold')
  @HttpCode(HttpStatus.OK)
  markSold(
    @CurrentUser() user: JwtPayload,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<ListingResponse> {
    return this.listings.setStatus(user.sub, id, 'sold');
  }

  @Post(':id/archive')
  @HttpCode(HttpStatus.OK)
  archive(
    @CurrentUser() user: JwtPayload,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<ListingResponse> {
    return this.listings.setStatus(user.sub, id, 'archived');
  }

  @Post(':id/reactivate')
  @HttpCode(HttpStatus.OK)
  reactivate(
    @CurrentUser() user: JwtPayload,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<ListingResponse> {
    return this.listings.setStatus(user.sub, id, 'active');
  }
}
