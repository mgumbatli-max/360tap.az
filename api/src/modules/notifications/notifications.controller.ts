import { Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsUUID, Min } from 'class-validator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/types/jwt-payload.type';
import { NotificationsService } from './notifications.service';

// Əvvəl controller heç bir @Query qəbul etmirdi: service-in `limit` parametri
// çağırılmadığı üçün siyahı HƏMİŞƏ 30 sətirdə kəsilirdi və 31-ci bildirişə çatmağın
// yolu yox idi. Kursor `chat.service.ts`-dəki keyset naxışı ilə eynidir.
class ListNotificationsDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) limit?: number;
  // Kursor: bu bildirişdən SONRAKI (daha köhnə) səhifə — sıralama yenidən köhnəyə doğrudur
  @IsOptional() @IsUUID('4') cursor?: string;
}

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  list(@CurrentUser() user: JwtPayload, @Query() q: ListNotificationsDto) {
    return this.notifications.list(user.sub, q.limit, q.cursor);
  }

  @Get('unread-count')
  unread(@CurrentUser() user: JwtPayload) {
    return this.notifications.unreadCount(user.sub);
  }

  @Post('read-all')
  readAll(@CurrentUser() user: JwtPayload) {
    return this.notifications.markAllRead(user.sub);
  }

  @Post(':id/read')
  read(
    @CurrentUser() user: JwtPayload,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    return this.notifications.markRead(user.sub, id);
  }
}
