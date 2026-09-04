import { Injectable, Logger, Module, type OnApplicationShutdown } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import {
  ThrottlerGuard,
  ThrottlerModule,
  ThrottlerStorageService,
  type ThrottlerModuleOptions,
  type ThrottlerRequest,
  type ThrottlerStorage,
} from '@nestjs/throttler';
import type Redis from 'ioredis';
import configuration from './config/configuration';
import { validateEnv } from './config/env.validation';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { PrismaModule } from './prisma/prisma.module';
import { REDIS, RedisModule } from './redis/redis.module';
import { QueueModule } from './queue/queue.module';
import { HealthModule } from './health/health.module';
import { MediaModule } from './media/media.module';
import { AuthModule } from './modules/auth/auth.module';
import { SearchModule } from './search/search.module';
import { AiModule } from './ai/ai.module';
import { GeoModule } from './modules/geo/geo.module';
import { StoresModule } from './modules/stores/stores.module';
import { ErpModule } from './modules/erp/erp.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { ListingsModule } from './modules/listings/listings.module';
import { FavoritesModule } from './modules/favorites/favorites.module';
import { ChatModule } from './modules/chat/chat.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { SavedSearchesModule } from './modules/saved-searches/saved-searches.module';
import { ReportsModule } from './modules/reports/reports.module';

/**
 * Etibar edilən proxy hop sayı. NİYƏ sabit `1` deyil: sabit dəyər BİRBAŞA qoşulan
 * istənilən müştərini də "proxy" sayırdı — müştəri X-Forwarded-For yazaraq req.ip-i,
 * deməli rate-limit açarını, hər sorğuda dəyişə bilirdi (limit faktiki olaraq yox idi).
 * Render edge tək hop-dur, ona görə prod default 1; lokal/birbaşa işləmədə proxy yoxdur (0).
 */
function resolveTrustProxyHops(): number {
  const raw = (process.env.TRUST_PROXY ?? '').trim().toLowerCase();
  if (raw === 'true') return 1;
  if (raw === 'false') return 0;
  if (raw !== '') {
    const parsed = Number.parseInt(raw, 10);
    if (Number.isInteger(parsed) && parsed >= 0) return parsed;
  }
  return process.env.NODE_ENV === 'production' ? 1 : 0;
}

export const TRUST_PROXY_HOPS = resolveTrustProxyHops();

interface ProxyAwareRequest {
  socket?: { remoteAddress?: string };
  headers?: Record<string, string | string[] | undefined>;
  body?: unknown;
}

/**
 * Saxtalaşdırıla bilməyən müştəri IP-si.
 * NİYƏ "birinci XFF elementi" YANLIŞDIR: zəncirin əvvəlini müştərinin özü yazır.
 * Uydurula bilməyən yeganə element bizim etibar etdiyimiz proxy-nin ƏLAVƏ ETDİYİDİR —
 * yəni sondan TRUST_PROXY_HOPS-uncu. Zəncir gözləniləndən qısadırsa (sorğu proxy-dən
 * keçməyib) tək həqiqət soket IP-sidir.
 */
function clientIp(req: ProxyAwareRequest): string {
  const socketIp = req.socket?.remoteAddress ?? 'unknown';
  if (TRUST_PROXY_HOPS <= 0) return socketIp;

  const header = req.headers?.['x-forwarded-for'];
  const chain = (Array.isArray(header) ? header.join(',') : (header ?? ''))
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part.length > 0);

  const index = chain.length - TRUST_PROXY_HOPS;
  return index >= 0 ? chain[index] : socketIp;
}

/**
 * Kredensial göndərən sorğular üçün hesab identifikatoru.
 * NİYƏ IP-dən əlavə: brute force IP-ni fırladaraq (mobil şəbəkə, proxy hovuzu) yalnız
 * IP-yə bağlı sayğacı keçir — hesabın özü qorunmamış qalır.
 * Yalnız `password` sahəsi olan gövdəyə baxılır ki, digər route-lar təsadüfən bloklanmasın;
 * konkret DTO-ya bağlılıq yoxdur, gövdə yoxdursa/formatsızdırsa sadəcə null qayıdır.
 */
function accountTracker(req: ProxyAwareRequest): string | null {
  const body = req.body;
  if (typeof body !== 'object' || body === null || Array.isArray(body)) return null;

  const fields = body as Record<string, unknown>;
  if (typeof fields.password !== 'string') return null;

  for (const field of ['identifier', 'email', 'phone']) {
    const value = fields[field];
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim().toLowerCase().slice(0, 190);
    }
  }
  return null;
}

@Injectable()
export class SecureThrottlerGuard extends ThrottlerGuard {
  // Tracker açarı artıq başlıqdan yox, etibarlı mənbədən gəlir (yuxarıdakı clientIp).
  protected async getTracker(req: ProxyAwareRequest): Promise<string> {
    return `ip:${clientIp(req)}`;
  }

  protected async handleRequest(props: ThrottlerRequest): Promise<boolean> {
    const allowed = await super.handleRequest(props);

    const { context, limit, ttl, throttler, blockDuration, generateKey } = props;
    const { req } = this.getRequestResponse(context);
    const account = accountTracker(req);
    if (!account) return allowed;

    // İkinci ölçü: eyni route-un limiti hesab identifikatoruna da tətbiq olunur.
    const name = throttler.name ?? 'default';
    const tracker = `acct:${account}`;
    const key = generateKey(context, tracker, name);
    const record = await this.storageService.increment(key, ttl, limit, blockDuration, name);
    if (record.isBlocked) {
      await this.throwThrottlingException(context, { limit, ttl, key, tracker, ...record });
    }
    return allowed;
  }
}

/**
 * Atomik sayğac: PTTL/INCR/PEXPIRE tək dövrədə icra olunur ki, paralel sorğular
 * arasında yarış olmasın (yoxsa limit sərhədində sayğac itir).
 * KEYS[1]=sayğac, KEYS[2]=blok bayrağı; ARGV=ttl(ms), limit, blockDuration(ms).
 */
const THROTTLE_SCRIPT = `
local hitsKey = KEYS[1]
local blockKey = KEYS[2]
local ttl = tonumber(ARGV[1])
local limit = tonumber(ARGV[2])
local blockDuration = tonumber(ARGV[3])

local blockTtl = redis.call('PTTL', blockKey)
if blockTtl > 0 then
  local blockedHits = tonumber(redis.call('GET', hitsKey)) or (limit + 1)
  local blockedExpire = redis.call('PTTL', hitsKey)
  if blockedExpire < 0 then blockedExpire = blockTtl end
  return { blockedHits, blockedExpire, 1, blockTtl }
end

local hits = redis.call('INCR', hitsKey)
if hits == 1 then
  redis.call('PEXPIRE', hitsKey, ttl)
end
local expire = redis.call('PTTL', hitsKey)
if expire < 0 then
  redis.call('PEXPIRE', hitsKey, ttl)
  expire = ttl
end

if hits > limit then
  redis.call('SET', blockKey, '1', 'PX', blockDuration)
  return { hits, expire, 1, blockDuration }
end
return { hits, expire, 0, 0 }
`;

/**
 * NİYƏ Redis: yaddaş storage-ı instans restart-ında sıfırlanır və çoxlu instansda
 * paylaşılmır — canlıda limit buna görə sızırdı.
 * NİYƏ fallback: Faza 0 prinsipi — opsional infra prosesi bloklamamalıdır. Redis
 * əlçatmazdırsa API ÇÖKMÜR, sayğac yaddaşa düşür (zəif, amma işlək) və bir dəfə loglanır.
 */
// ThrottlerStorageRecord paketin index-indən ixrac olunmur — tipi interfeysin özündən götürürük.
type ThrottleRecord = Awaited<ReturnType<ThrottlerStorage['increment']>>;

class RedisThrottlerStorage implements ThrottlerStorage, OnApplicationShutdown {
  private readonly logger = new Logger('ThrottlerStorage');
  private readonly fallback = new ThrottlerStorageService();
  private degraded = false;

  constructor(private readonly redis: Redis) {}

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ): Promise<ThrottleRecord> {
    try {
      const raw = (await this.redis.eval(
        THROTTLE_SCRIPT,
        2,
        `thr:${key}`,
        `thr:blocked:${key}`,
        ttl,
        limit,
        blockDuration,
      )) as [number, number, number, number];

      if (this.degraded) {
        this.degraded = false;
        this.logger.log('Redis throttle storage bərpa olundu');
      }
      const [totalHits, timeToExpireMs, blocked, timeToBlockExpireMs] = raw;
      return {
        totalHits,
        // Guard saniyə gözləyir (yaddaş storage-ı da belə qaytarır).
        timeToExpire: Math.ceil(timeToExpireMs / 1000),
        isBlocked: blocked === 1,
        timeToBlockExpire: Math.ceil(timeToBlockExpireMs / 1000),
      };
    } catch (err) {
      if (!this.degraded) {
        this.degraded = true;
        this.logger.warn(
          `Redis throttle storage əlçatmazdır — yaddaş sayğacına keçilir: ${
            err instanceof Error ? err.message : String(err)
          }`,
        );
      }
      return this.fallback.increment(key, ttl, limit, blockDuration, throttlerName);
    }
  }

  onApplicationShutdown(): void {
    this.fallback.onApplicationShutdown();
  }
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate: validateEnv,
      cache: true,
    }),
    ThrottlerModule.forRootAsync({
      imports: [RedisModule],
      inject: [REDIS],
      useFactory: (redis: Redis): ThrottlerModuleOptions => ({
        throttlers: [
          {
            ttl: parseInt(process.env.THROTTLE_TTL ?? '60', 10) * 1000,
            limit: parseInt(process.env.THROTTLE_LIMIT ?? '300', 10),
          },
        ],
        storage: new RedisThrottlerStorage(redis),
      }),
    }),
    PrismaModule,
    RedisModule,
    QueueModule,
    HealthModule,
    MediaModule,
    SearchModule,
    AiModule,
    AuthModule,
    GeoModule,
    StoresModule,
    ErpModule,
    CategoriesModule,
    ListingsModule,
    FavoritesModule,
    ChatModule,
    NotificationsModule,
    ReviewsModule,
    SavedSearchesModule,
    ReportsModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: SecureThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard }, // @Roles olmayan route-lara təsir etmir
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
  ],
})
export class AppModule {}
