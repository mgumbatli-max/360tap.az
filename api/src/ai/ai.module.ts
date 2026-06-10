import { Module } from '@nestjs/common';
import { ListingsModule } from '../modules/listings/listings.module';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';

@Module({
  imports: [ListingsModule],
  controllers: [AiController],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
