import { Body, Controller, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/types/jwt-payload.type';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  // Şikayət nadir əməliyyatdır; qlobal 300/dəq limiti moderasiya növbəsini doldurmağa
  // imkan verirdi. 10/dəq real istifadə üçün geniş, avtomatlaşdırılmış sel üçün dardır.
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateReportDto) {
    return this.reports.create(user.sub, dto);
  }
}
