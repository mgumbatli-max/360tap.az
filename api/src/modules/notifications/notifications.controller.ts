import { Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/types/jwt-payload.type';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  list(@CurrentUser() user: JwtPayload) {
    return this.notifications.list(user.sub);
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
