import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MediaService, type IncomingFile, type UploadedMedia } from './media.service';

@Controller('media')
export class MediaController {
  constructor(private readonly media: MediaService) {}

  // Auth tələb olunur (qlobal JwtAuthGuard — @Public yoxdur)
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(@UploadedFile() file?: IncomingFile): Promise<UploadedMedia> {
    if (!file?.buffer) throw new BadRequestException('Fayl tələb olunur (field: file)');
    return this.media.upload(file);
  }
}
