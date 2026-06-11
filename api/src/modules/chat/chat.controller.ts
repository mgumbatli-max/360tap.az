import { Body, Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { IsOptional, IsString, IsUUID, Length } from 'class-validator';
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
  ) {
    return this.chat.getMessages(user.sub, id);
  }

  @Post(':id/messages')
  send(
    @CurrentUser() user: JwtPayload,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: SendDto,
  ) {
    return this.chat.sendMessage(user.sub, id, dto.content);
  }
}
