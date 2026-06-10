import { Controller, Get } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';

@Controller('health')
export class HealthController {
  @Public()
  @Get()
  check(): { ok: boolean; service: string; ts: number } {
    return { ok: true, service: '360tap.az api', ts: Date.now() };
  }
}
