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
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { OptionalJwtAuthGuard } from './guards/optional-jwt.guard';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';
import type { ListingResponse } from './dto/listing-response.dto';
import { QueryListingsDto } from './dto/query-listings.dto';
import { ListingsService } from './listings.service';
import type { JwtPayload } from '../auth/types/jwt-payload.type';

/**
 * Elan id-si üçün ortaq pipe.
 *
 * Standart `ParseUUIDPipe` slug ilə gələn sorğuya 400 «Validation failed (uuid v 4 is
 * expected)» verirdi — halbuki «bu id-li elan yoxdur» halı 404-dür. Səhv təsnifat
 * monitorinqdə real 4xx səs-küyü yaradırdı; frontend onsuz da 404 səhifəsi göstərir.
 * Yalnız ictimai (GET) marşrutlarda işlədilir: orada «tapılmadı» semantikası düzgündür.
 */
const listingIdPipe = new ParseUUIDPipe({
  version: '4',
  exceptionFactory: () => new NotFoundException('Elan tapılmadı'),
});

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

  // `@Public()` + OptionalJwtAuthGuard: marşrut ictimai qalır, sadəcə token
  // göndərilibsə baxanın kim olduğu servisə ötürülür — sahib öz qeyri-aktiv elanını
  // görə bilsin (bax: ListingsService.findById şərhi).
  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Get(':id')
  async getById(
    @Param('id', listingIdPipe) id: string,
    @CurrentUser() user?: JwtPayload,
  ): Promise<ListingResponse> {
    const listing = await this.listings.findById(id, user?.sub);
    if (!listing) throw new NotFoundException('Elan tapılmadı');
    return listing;
  }

  @Public()
  @Get(':id/similar')
  similar(@Param('id', listingIdPipe) id: string): Promise<ListingResponse[]> {
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
