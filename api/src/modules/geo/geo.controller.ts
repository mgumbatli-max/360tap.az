import { Controller, Get, Param, ParseFloatPipe, ParseUUIDPipe, Query } from '@nestjs/common';
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
  // ParseUUIDPipe: qeyri-UUID id Postgres-ə çatanda `DatabaseError` (500)
  // qaytarırdı — indi 400. Versiya PİNLƏNMİR (`version: '4'` verilmir), çünki
  // gələcək seed başqa UUID versiyası yarada bilər.
  nearby(@Param('id', ParseUUIDPipe) id: string) {
    return this.geo.nearby(id);
  }

  @Public()
  @Get('resolve')
  resolve(
    @Query('lat', ParseFloatPipe) lat: number,
    @Query('lng', ParseFloatPipe) lng: number,
  ) {
    return this.geo.resolveNearest(lat, lng);
  }
}
