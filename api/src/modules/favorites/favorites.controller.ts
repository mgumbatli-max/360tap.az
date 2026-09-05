import { Controller, Delete, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/types/jwt-payload.type';
import { FavoritesService } from './favorites.service';

// `ids` vergüllə ayrılmış siyahıdır, ona görə `ParseUUIDPipe` (tək dəyər üçün) uyğun gəlmir.
// Zibil dəyər süzülmədən Prisma-ya çatanda `uuid = 'abc'` cast xətası 500 verirdi.
const UUID_V4_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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
    // Yalnız düzgün UUID-lər ötürülür: yad dəyər 500 əvəzinə sadəcə nəzərə alınmır
    // (legitim klient onsuz da real id göndərir, onun cavabı dəyişmir).
    const list = (ids ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter((s) => UUID_V4_RE.test(s));
    return this.favorites.check(user.sub, list);
  }
}
