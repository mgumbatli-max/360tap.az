import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/types/jwt-payload.type';
import { SavedSearchesService } from './saved-searches.service';
import { CreateSavedSearchDto } from './dto/create-saved-search.dto';

@Controller('saved-searches')
export class SavedSearchesController {
  constructor(private readonly saved: SavedSearchesService) {}

  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateSavedSearchDto) {
    return this.saved.create(user.sub, dto);
  }

  @Get()
  list(@CurrentUser() user: JwtPayload) {
    return this.saved.list(user.sub);
  }

  @Delete(':id')
  remove(
    @CurrentUser() user: JwtPayload,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    return this.saved.remove(user.sub, id);
  }

  @Patch(':id')
  setNotify(
    @CurrentUser() user: JwtPayload,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() body: { notify?: boolean },
  ) {
    return this.saved.setNotify(user.sub, id, !!body.notify);
  }
}
