import { Controller, Get, Inject, Optional, ServiceUnavailableException } from '@nestjs/common';
import type Redis from 'ioredis';
import { Public } from '../common/decorators/public.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { REDIS } from '../redis/redis.module';
import { SearchService } from '../search/search.service';

interface LivenessResponse {
  ok: boolean;
  service: string;
  ts: number;
  uptimeSec: number;
}

interface ReadinessResponse {
  ok: boolean;
  ts: number;
  uptimeSec: number;
  dependencies: {
    database: { required: true; ok: boolean; status: string; error: string | null };
    search: { required: false; ok: boolean; status: string; error: string | null };
    redis: { required: false; ok: boolean; status: string };
  };
}

@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly search: SearchService,
    @Optional() @Inject(REDIS) private readonly redis?: Redis,
  ) {}

  /**
   * LIVENESS — proses diridirmi?
   * Heç bir xarici asılılığı yoxlamır və HEÇ VAXT 503 vermir.
   * Render/UptimeRobot health check məhz buna baxmalıdır: DB müvəqqəti düşəndə
   * konteynerin restart döngəsinə düşməsinin qarşısını alır.
   */
  @Public()
  @Get()
  check(): LivenessResponse {
    return {
      ok: true,
      service: '360tap.az api',
      ts: Date.now(),
      uptimeSec: Math.round(process.uptime()),
    };
  }

  /**
   * READINESS — trafik qəbul etməyə hazırdırmı?
   * Yalnız DB məcburidir. Search və Redis opsionaldır: onlar düşəndə API
   * degraded rejimdə işləməyə davam edir (200 qaytarır).
   */
  @Public()
  @Get('ready')
  async ready(): Promise<ReadinessResponse> {
    const dbOk = await this.prisma.ping();
    const db = this.prisma.getDbStatus();
    const s = this.search.getStatus();

    const redisStatus = this.redis?.status ?? 'not-configured';
    const body: ReadinessResponse = {
      ok: dbOk,
      ts: Date.now(),
      uptimeSec: Math.round(process.uptime()),
      dependencies: {
        database: { required: true, ok: dbOk, status: db.status, error: db.lastError },
        search: {
          required: false,
          ok: s.status === 'available',
          status: s.status,
          error: s.lastError,
        },
        redis: { required: false, ok: redisStatus === 'ready', status: redisStatus },
      },
    };

    if (!dbOk) {
      // 503 — orkestrator/monitorinq üçün aydın siqnal (proses isə diri qalır).
      throw new ServiceUnavailableException(body);
    }
    return body;
  }
}
