import { Controller, Get, Post, Query } from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Length, Max, Min } from 'class-validator';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/guards/roles.guard';
import { SearchService } from './search.service';

class SearchQuery {
  @IsOptional() @IsString() @Length(0, 200) q?: string;
  @IsOptional() @IsString() region?: string;
  @IsOptional() @IsString() vertical?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(50) limit?: number;
}

@Controller('search')
export class SearchController {
  constructor(private readonly search: SearchService) {}

  @Public()
  @Get()
  query(@Query() q: SearchQuery) {
    return this.search.search(q);
  }

  // Yalnız admin — ağır əməliyyat (bütün aktiv elanları yenidən indeksləyir)
  @Roles('admin', 'super_admin')
  @Post('reindex')
  async reindex() {
    const reindexed = await this.search.reindexActive();
    return { reindexed };
  }
}
