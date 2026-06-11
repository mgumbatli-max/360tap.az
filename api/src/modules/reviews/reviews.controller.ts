import { Body, Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/types/jwt-payload.type';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateReviewDto) {
    return this.reviews.create(user.sub, dto);
  }

  // İstifadəçinin (satıcının) reytinqi + rəyləri — açıq
  @Public()
  @Get('user/:userId')
  forUser(@Param('userId', new ParseUUIDPipe({ version: '4' })) userId: string) {
    return this.reviews.forUser(userId);
  }
}
