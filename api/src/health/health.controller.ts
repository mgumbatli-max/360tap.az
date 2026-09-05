import { createHash } from 'node:crypto';
import { Controller, Get, Inject, Optional, Req, ServiceUnavailableException } from '@nestjs/common';
import type Redis from 'ioredis';
import { Public } from '../common/decorators/public.decorator';
import {
  clientIp,
  forwardedChain,
  TRUST_PROXY_HOPS,
  type ProxyAwareRequest,
} from '../common/client-ip';
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

  /**
   * RATE LIMIT AÇARININ DİAQNOSTİKASI — «bucket kimə aiddir?» sualına cavab.
   *
   * NİYƏ LAZIM OLDU: canlıda ölçüldü ki, `https://360tap.az/api/auth/login`-ə ardıcıl
   * 14 sorğu 429 alır, halbuki eyni anda birbaşa Render ünvanına gedən sorğu keçir.
   * Yəni proxy arxasından gələn BÜTÜN ziyarətçilər eyni səbəti paylaşır: rate limit
   * istifadəçini yox, infrastrukturu ölçür. Bir nəfər saytın girişini hamıya bağlaya bilər.
   *
   * Kök səbəb XFF zəncirinin neçənci elementinə etibar etdiyimizdədir (TRUST_PROXY).
   * Düzgün dəyəri TAPMAQ üçün canlıda faktiki zəncirin uzunluğunu görmək lazımdır —
   * bu endpoint məhz onu göstərir.
   *
   * NİYƏ TƏHLÜKƏSİZDİR: xam IP-lər QAYTARILMIR. Yalnız (a) zəncirin uzunluğu,
   * (b) hər elementin qısa hash-i, (c) seçilmiş açarın hash-i verilir. Bu, iki fərqli
   * şəbəkədən eyni açarın çıxıb-çıxmadığını müqayisə etməyə kifayətdir, amma heç kimin
   * IP-sini ifşa etmir.
   */
  @Public()
  @Get('net')
  net(@Req() req: ProxyAwareRequest): {
    trustProxyHops: number;
    chainLength: number;
    chain: string[];
    socket: string;
    selectedKey: string;
    candidates: Record<string, string | null>;
    note: string;
  } {
    const short = (v: string): string => createHash('sha256').update(v).digest('hex').slice(0, 10);
    const chain = forwardedChain(req);

    // Hansı «real müştəri IP-si» başlığının mövcud olduğunu göstərir. XFF hop sayı
    // yola görə dəyişir (ölçüldü: proxy üzərindən 4, birbaşa 3), ona görə sabit hop
    // etibarlı açar vermir — bu başlıqlardan biri varsa, düzgün həll odur.
    const candidates: Record<string, string | null> = {};
    for (const name of ['cf-connecting-ip', 'true-client-ip', 'x-real-ip', 'fly-client-ip']) {
      const raw = req.headers?.[name];
      const value = Array.isArray(raw) ? raw[0] : raw;
      candidates[name] = value ? short(value) : null;
    }

    return {
      trustProxyHops: TRUST_PROXY_HOPS,
      chainLength: chain.length,
      chain: chain.map(short),
      socket: short(req.socket?.remoteAddress ?? 'unknown'),
      selectedKey: short(clientIp(req)),
      candidates,
      note: 'Fərqli şəbəkələrdən eyni selectedKey gəlirsə, rate limit bucket-i paylaşılır.',
    };
  }
}
