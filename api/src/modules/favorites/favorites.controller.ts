import { Controller, Delete, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/types/jwt-payload.type';
import { FavoritesService } from './favorites.service';

@Controller()
export class FavoritesController {
  constructor(private readonly favorites: FavoritesService) {}

  @Post('listings/:id/favorite')
  add(@CurrentUser() user: JwtPayload, @Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.favorites.add(user.sub, id);
  }

  @Delete('listings/:id/favorite')
  remove(@CurrentUser() user: JwtPayload, @Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.favorites.remove(user.sub, id);
  }

  @Get('favorites')
  list(@CurrentUser() user: JwtPayload) {
    return this.favorites.list(user.sub);
  }

  // GET /favorites/check?ids=a,b,c → favorit olan id-lər
  @Get('favorites/check')
  async check(@CurrentUser() user: JwtPayload, @Query('ids') ids?: string) {
    const list = (ids ?? '').split(',').map((s) => s.trim()).filter(Boolean);
    return this.favorites.check(user.sub, list);
  }
}
