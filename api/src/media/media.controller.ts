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
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 8 * 1024 * 1024, files: 1 },
      fileFilter: (_req, f, cb) => {
        const ok = ['image/jpeg', 'image/png', 'image/webp'].includes(f.mimetype);
        cb(ok ? null : new BadRequestException('Yalnız JPEG/PNG/WebP şəkil qəbul olunur'), ok);
      },
    }),
  )
  async upload(@UploadedFile() file?: IncomingFile): Promise<UploadedMedia> {
    if (!file?.buffer) throw new BadRequestException('Fayl tələb olunur (field: file)');
    return this.media.upload(file);
  }
}
