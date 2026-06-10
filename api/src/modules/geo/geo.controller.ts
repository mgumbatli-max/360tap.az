import { Controller, Get, Param, Query } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { GeoService } from './geo.service';

@Controller('geo')
export class GeoController {
  constructor(private readonly geo: GeoService) {}

  @Public()
  @Get('regions')
  regions() {
    return this.geo.regions();
  }

  @Public()
  @Get('regions/:slug/districts')
  districts(@Param('slug') slug: string) {
    return this.geo.districts(slug);
  }

  @Public()
  @Get('districts/:id/nearby')
  nearby(@Param('id') id: string) {
    return this.geo.nearby(id);
  }

  @Public()
  @Get('resolve')
  resolve(@Query('lat') lat: string, @Query('lng') lng: string) {
    return this.geo.resolveNearest(Number(lat), Number(lng));
  }
}
