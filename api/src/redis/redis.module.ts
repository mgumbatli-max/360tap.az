import { Global, Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { resolveRedisFamily } from './redis-family';

export const REDIS = 'REDIS';
export const REDIS_HEALTH = 'REDIS_HEALTH';

/** Redis bağlantısının son vəziyyəti — `/health/ready` diaqnostikası üçün. */
export interface RedisHealth {
  /** Sonuncu bağlantı xətasının mesajı (kredensial təmizlənmiş). */
  lastError: string | null;
  /** Bağlantı heç olmasa bir dəfə qurulubmu? */
  everConnected: boolean;
  /** Hansı IP ailəsi ilə qoşulmağa çalışırıq (0 = hər ikisi). */
  family: number;
}

/**
 * BAĞLANTI ÜNVANINDAN KREDENSİALI TƏMİZLƏ.
 *
 * `ioredis` xəta mesajlarına bəzən tam URL-i qoyur. Həmin mesaj `/health/ready`
 * cavabında ictimai görünür, ona görə parol və istifadəçi adı çıxarılır — əks halda
 * diaqnostika özü sızma mənbəyinə çevrilərdi.
 */
function scrub(message: string): string {
  return message.replace(/(rediss?:\/\/)[^@\s]*@/gi, '$1***@');
}

/**
 * Faza 0: əvvəl `maxRetriesPerRequest: null` idi — bu, Redis düşəndə HƏR əmri
 * sonsuz növbəyə salırdı (məs. ERP guard-ın nonce yoxlaması əbədi asılırdı).
 * İndi fail-fast: bağlantı yoxdursa əmr dərhal xəta verir, çağıran tərəf
 * qərar verir. Ayrıca 'error' hadisəsi tutulur — əks halda ioredis-in
 * emal olunmamış 'error' event-i prosesi qırır.
 */
@Global()
@Module({
  providers: [
    {
      provide: REDIS_HEALTH,
      useFactory: (): RedisHealth => ({
        lastError: null,
        everConnected: false,
        family: resolveRedisFamily(),
      }),
    },
    {
      provide: REDIS,
      inject: [ConfigService, REDIS_HEALTH],
      useFactory: (config: ConfigService, health: RedisHealth): Redis => {
        const logger = new Logger('Redis');
        const url = config.get<string>('redisUrl') ?? 'redis://localhost:6379';
        const family = health.family;

        const client = new Redis(url, {
          // Render Key Value yalnız IPv6 verir — bax `resolveFamily()` şərhi.
          family,
          // Sonsuz növbə YOX — Redis əlçatmazdırsa əmrlər dərhal rədd olunsun.
          maxRetriesPerRequest: 2,
          enableOfflineQueue: false,
          connectTimeout: 5_000,
          // Yenidən qoşulma cəhdləri arasında artan gecikmə (maks 10s).
          retryStrategy: (times) => Math.min(times * 500, 10_000),
        });

        let loggedDown = false;
        client.on('error', (err: Error) => {
          // Xəta mesajı HƏMİŞƏ saxlanılır (loq bir dəfə yazılsa da) — `/health/ready`
          // səbəbi göstərə bilsin. Əvvəl səbəb heç yerdə görünmürdü və canlıda
          // «reconnecting» vəziyyətinin niyəsini tapmaq mümkün deyildi.
          health.lastError = scrub(err.message);
          if (!loggedDown) {
            loggedDown = true;
            logger.warn(`Redis əlçatmazdır (degraded, family=${family}): ${health.lastError}`);
          }
        });
        client.on('ready', () => {
          loggedDown = false;
          health.lastError = null;
          health.everConnected = true;
          logger.log(`Redis qoşuldu (family=${family})`);
        });

        return client;
      },
    },
  ],
  exports: [REDIS, REDIS_HEALTH],
})
export class RedisModule {}
