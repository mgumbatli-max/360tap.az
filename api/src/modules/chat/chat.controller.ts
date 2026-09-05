import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, IsUUID, Length, Min } from 'class-validator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/types/jwt-payload.type';
import { ChatService } from './chat.service';

class StartDto {
  @IsUUID('4') listingId!: string;
  @IsOptional() @IsString() @Length(1, 2000) message?: string;
}
class SendDto {
  @IsString() @Length(1, 2000) content!: string;
}
class MessagesQueryDto {
  // Kursor: bu mesajdan ƏVVƏLKİ (daha köhnə) səhifə — sıralama ən yenidən köhnəyə doğrudur
  @IsOptional() @IsUUID('4') before?: string;
  // limit > 200 rədd edilmir — service Math.min(limit, 200) ilə clamp edir
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) limit?: number;
}

@Controller('conversations')
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  @Post()
  start(@CurrentUser() user: JwtPayload, @Body() dto: StartDto) {
    return this.chat.start(user.sub, dto.listingId, dto.message);
  }

  @Get()
  list(@CurrentUser() user: JwtPayload) {
    return this.chat.listConversations(user.sub);
  }

  @Get(':id/messages')
  messages(
    @CurrentUser() user: JwtPayload,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Query() query: MessagesQueryDto,
  ) {
    return this.chat.getMessages(user.sub, id, { limit: query.limit, before: query.before });
  }

  // Anti-spam: əvvəl yeganə qoruma qlobal 300/dəq idi — bir hesab bir neçə saniyəyə
  // qarşı tərəfi 40+ mesaj və bildirişlə doldura bilirdi (auth.controller.ts-də olduğu
  // kimi endpoint səviyyəli limit yox idi).
  // 30/dəq seçildi: canlı yazışma üçün geniş (2 saniyəyə bir mesaj), sel üçün dar.
  // Tracker IP əsaslıdır (SecureThrottlerGuard) — NAT arxasındakı istifadəçilər eyni
  // limiti bölüşür, ona görə daha aşağı (20) dəyər QƏSDƏN seçilmədi.
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @Post(':id/messages')
  send(
    @CurrentUser() user: JwtPayload,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: SendDto,
  ) {
    return this.chat.sendMessage(user.sub, id, dto.content);
  }
}
