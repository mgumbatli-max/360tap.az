import { Body, Controller, Post } from '@nestjs/common';
import { IsString, Length } from 'class-validator';
import { Public } from '../common/decorators/public.decorator';
import { AiService } from './ai.service';

class AiSearchDto {
  @IsString() @Length(1, 300) query!: string;
}
class AiGenerateDto {
  @IsString() @Length(3, 1000) text!: string;
}
class AiImageSearchDto {
  // base64 data URL (data:image/...;base64,...)
  @IsString() @Length(20, 8_000_000) image!: string;
}

@Controller('ai')
export class AiController {
  constructor(private readonly ai: AiService) {}

  // Public — AI axtarış (təbii dil → nəticələr)
  @Public()
  @Post('search')
  search(@Body() dto: AiSearchDto) {
    return this.ai.aiSearch(dto.query);
  }

  // Public — şəkillə axtarış (vision → məhsul tanı → tap)
  @Public()
  @Post('image-search')
  imageSearch(@Body() dto: AiImageSearchDto) {
    return this.ai.imageSearch(dto.image);
  }

  // Public — sərbəst mətndən elan layihəsi (yalnız layihə qaytarır, DB-yə yazmır)
  @Public()
  @Post('generate-listing')
  generate(@Body() dto: AiGenerateDto) {
    return this.ai.generateListing(dto.text);
  }
}
