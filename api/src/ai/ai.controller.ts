import { Body, Controller, Post } from '@nestjs/common';
import { IsNumber, IsObject, IsOptional, IsString, Length } from 'class-validator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import type { JwtPayload } from '../modules/auth/types/jwt-payload.type';
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
class AiCreateListingDto {
  @IsString() @Length(2, 120) title!: string;
  @IsString() @Length(2, 5000) description!: string;
  @IsString() category!: string;
  @IsOptional() @IsString() region?: string;
  @IsOptional() @IsNumber() price?: number;
  @IsOptional() @IsObject() attributes?: Record<string, unknown>;
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

  // Auth — AI layihəsindən real elan yarat
  @Post('create-listing')
  createListing(@CurrentUser() user: JwtPayload, @Body() dto: AiCreateListingDto) {
    return this.ai.createListing(user.sub, dto);
  }
}
