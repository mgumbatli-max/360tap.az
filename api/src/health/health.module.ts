import { Module } from '@nestjs/common';
import { SearchModule } from '../search/search.module';
import { HealthController } from './health.controller';

// PrismaModule və RedisModule @Global-dır; SearchService üçün SearchModule import olunur.
@Module({ imports: [SearchModule], controllers: [HealthController] })
export class HealthModule {}
