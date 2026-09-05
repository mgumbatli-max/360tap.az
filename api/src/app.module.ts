import {
  Injectable,
  Logger,
  Module,
  type ExecutionContext,
  type OnApplicationShutdown,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
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
import { MessagingModule } from './modules/messaging/messaging.module';
import { SettingsModule } from './modules/settings/settings.module';
import { VerificationModule } from './modules/verification/verification.module';
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
import { BillingModule } from './modules/billing/billing.module';
import { AdminModule } from './modules/admin/admin.module';
import { AlertsModule } from './modules/alerts/alerts.module';
import { clientIp, isInternalSsrRequest, type ProxyAwareRequest } from './common/client-ip';

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

/**
 * E2E QOŞQUSU ÜÇÜN KEÇİD AÇARI — YALNIZ QEYRİ-PRODUCTION.
 *
 * NİYƏ LAZIMDIR: E2E dəsti tam paralel icrada `POST /auth/register`-ə 12 sorğu göndərir
 * (03-auth × 3 viewport + 04-account × 3 test × 3 viewport), limit isə 5/60s-dir.
 * Bütün Playwright worker-ləri eyni soketdən gəldiyi üçün tracker də eynidir (`ip:::1`) —
 * yəni worker sayını azaltmaq problemi HƏLL ETMİR, sadəcə gizlədir. Ölçüldü: ardıcıl
 * (--workers=1) icrada belə 6-cı qeydiyyat 429 alır, 7-ci də, sonra 60s TTL sıfırlanır.
 *
 * NİYƏ BELƏ: `NODE_ENV === 'production'` olduqda bu funksiya HƏMİŞƏ false qaytarır —
 * yəni canlıda açar mövcud olsa belə keçid yoxdur. Env dəyişəni təyin olunmayıbsa da
 * keçid yoxdur (default bağlı). Beləliklə istehsal davranışı dəyişmir.
 *
 * NƏ ÜÇÜN LİMİTİ SADƏCƏ ARTIRMADIQ: limit rəqəmi məhsul qərarıdır; onu test rahatlığı
 * üçün dəyişmək canlı qorumanı zəiflədərdi.
 */
function e2eBypassEnabled(): boolean {
  if (process.env.NODE_ENV === 'production') return false;
  return (process.env.E2E_THROTTLE_BYPASS ?? '').trim().length > 0;
}

const E2E_BYPASS_HEADER = 'x-e2e-throttle-bypass';

@Injectable()
export class SecureThrottlerGuard extends ThrottlerGuard {
  // Tracker açarı artıq başlıqdan yox, etibarlı mənbədən gəlir (yuxarıdakı clientIp).
  protected async getTracker(req: ProxyAwareRequest): Promise<string> {
    return `ip:${clientIp(req)}`;
  }

  /**
   * DİQQƏT: `shouldSkip` true qaytardıqda `handleRequest` ÜMUMİYYƏTLƏ çağırılmır —
   * yəni aşağıdakı hesab ölçüsündəki brute-force sayğacı da işləmir. Məhz buna görə
   * keçid production-da bağlıdır və yalnız düzgün gizli açarla açılır.
   */
  protected async shouldSkip(context: ExecutionContext): Promise<boolean> {
    const { req } = this.getRequestResponse(context);

    if (e2eBypassEnabled()) {
      const raw = (req as ProxyAwareRequest).headers?.[E2E_BYPASS_HEADER];
      const value = Array.isArray(raw) ? raw[0] : raw;
      if (value && value === process.env.E2E_THROTTLE_BYPASS) return true;
    }

    // ÖZ SSR RENDERİMİZ — istifadəçi limitindən ayrılır.
    //
    // NİYƏ: səhifə render-i zamanı Next.js serveri backend-ə sorğu atır. Bu sorğu
    // brauzerdən gəlmir, ona görə nə middleware-in imzaladığı IP-ni, nə də istifadəçinin
    // öz açarını daşıyır — bütün SSR trafiki TƏK bucket-ə düşür. Ölçüldü (E2E, diaqnostik
    // log): bir icrada `18 × HTTP 429 /api/v1/listings/<id>`, nəticədə MÖVCUD elan
    // səhifələri «Elan müvəqqəti yüklənmir» ekranına düşdü. Canlıda eyni mexanizm
    // populyar səhifələri sıradan çıxarardı.
    //
    // NİYƏ TƏHLÜKƏSİZDİR:
    //  · İmza tələb olunur (`INTERNAL_IP_SECRET`) — kənar şəxs bu yolu aça bilmir.
    //  · YALNIZ GET. Yazma və auth əməliyyatları SSR-dən getmir, ona görə brute-force
    //    və qeydiyyat limitləri toxunulmaz qalır.
    //  · İstifadəçi səviyyəsində qoruma itmir: brauzerdən gələn hər sorğu middleware-in
    //    imzaladığı real IP ilə ölçülməyə davam edir.
    if (isInternalSsrRequest(req as ProxyAwareRequest)) return true;

    return super.shouldSkip(context);
  }

  protected async handleRequest(props: ThrottlerRequest): Promise<boolean> {
    const allowed = await super.handleRequest(props);

    const { context, limit, ttl, throttler, blockDuration, generateKey } = props;
    const { req, res } = this.getRequestResponse(context);
    const account = accountTracker(req);
    if (!account) return allowed;

    // İkinci ölçü: eyni route-un limiti hesab identifikatoruna da tətbiq olunur.
    const name = throttler.name ?? 'default';
    const tracker = `acct:${account}`;
    const key = generateKey(context, tracker, name);
    const record = await this.storageService.increment(key, ttl, limit, blockDuration, name);
    if (record.isBlocked) {
      // `Retry-After` başlığını paketin özü yalnız IP ölçüsündə qoyur (super.handleRequest
      // daxilində). Hesab ölçüsündə blok olanda başlıq itirdi — nəticədə eyni 429 bəzən
      // başlıqlı, bəzən başlıqsız gəlirdi və müştəri nə qədər gözləyəcəyini bilmirdi.
      if (typeof res?.header === 'function') {
        res.header('Retry-After', String(Math.ceil(record.timeToBlockExpire)));
      }
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
        // Paketin default mesajı «ThrottlerException: Too Many Requests»-dir və o,
        // birbaşa istifadəçiyə çatırdı: ingiliscə, texniki və nə qədər gözləməli
        // olduğunu demir. Sayt azərbaycandilli olduğu üçün mesaj da azərbaycancadır
        // və gözləmə müddətini saniyə ilə göstərir (Retry-After başlığı ilə eyni dəyər).
        errorMessage: (_ctx, detail): string => {
          const sec = Math.max(1, Math.ceil((detail?.timeToBlockExpire ?? 60) || 60));
          return `Çox sayda cəhd oldu. ${sec} saniyə sonra yenidən yoxlayın.`;
        },
      }),
    }),
    // Periodik bildiriş tetikləyiciləri üçün (alerts modulu). Redis TƏLƏB ETMİR —
    // canlıda Redis qopuq olduğu üçün BullMQ əvəzinə in-process cron seçilib.
    // Render pulsuz planında tək instans işlədiyi üçün cron təkrarlanma riski yoxdur.
    ScheduleModule.forRoot(),
    PrismaModule,
    RedisModule,
    QueueModule,
    HealthModule,
    MediaModule,
    SearchModule,
    AiModule,
    MessagingModule, // @Global — MailService/SmsService bütün modullara açılır
    SettingsModule, // @Global — monetizasiya bayraqları (admin panelindən idarə olunur)
    VerificationModule,
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
    AdminModule, // /api/v1/admin/* — hamısı @Roles('admin','super_admin') ilə qorunur
    // Bildiriş tetikləyiciləri (cron) — bax modules/alerts/alerts.module.ts
    AlertsModule,
    BillingModule, // paketlər/abunələr/limit mühərriki — bayraqlar bağlı olduğu üçün passiv dayanır
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
