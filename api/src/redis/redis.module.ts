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
  /**
   * Hədəf ünvanın FORMATI — parol və istifadəçi adı OLMADAN.
   * Canlıda `ECONNREFUSED` alındıqda ilk sual «hara qoşulmağa çalışırıq?» olur:
   * sxem `rediss://` (TLS) yoxsa `redis://`, port standartdırmı, host adı
   * gözlənilən servisdirmi. Bunlar olmadan uzaqdan diaqnoz qoymaq mümkün deyil.
   */
  target: { scheme: string; host: string; port: string; tls: boolean } | null;
  /**
   * IOREDIS-İN ÖZ GÖRDÜYÜ konfiqurasiya (`client.options`).
   *
   * NİYƏ BU DA LAZIMDIR: URL-in bizim tərəfimizdən oxunuşu ilə ioredis-in oxunuşu
   * FƏRQLƏNƏ bilər — canlıda məhz belə oldu: bizim `new URL()` sındı (target=null),
   * ioredis isə real IP-yə qoşulmağa çalışırdı. Bu sahə həmin fərqi görünən edir və
   * «hansı host/port/TLS ilə cəhd edilir?» sualına birbaşa cavab verir.
   */
  effective: { host: string; port: number; tls: boolean; family: number | null } | null;
  /** Xam dəyərin metadatası — dəyərin ÖZÜ deyil (uzunluq və sxem prefiksi). */
  raw: { length: number; startsWith: string } | null;
}

/** URL-i kredensialsız hissələrə ayırır; yararsız URL-də `null` qaytarır. */
function describeTarget(raw: string): RedisHealth['target'] {
  try {
    const u = new URL(raw);
    return {
      scheme: u.protocol.replace(':', ''),
      host: u.hostname,
      port: u.port || '(default 6379)',
      tls: u.protocol === 'rediss:',
    };
  } catch {
    return null;
  }
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
        target: describeTarget(process.env.REDIS_URL ?? 'redis://localhost:6379'),
        effective: null,
        raw: (() => {
          const v = process.env.REDIS_URL;
          if (typeof v !== 'string') return null;
          // Dəyərin ÖZÜ heç vaxt qaytarılmır — yalnız uzunluq və sxem prefiksi.
          const m = /^[a-z][a-z0-9+.-]*:\/\//i.exec(v);
          return { length: v.length, startsWith: m ? m[0] : '(sxem yoxdur)' };
        })(),
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

        // ioredis konfiqurasiyanı özü parse edir; onun NƏTİCƏSİNİ oxuyuruq.
        const opts = client.options as {
          host?: string; port?: number; tls?: unknown; family?: number;
        };
        health.effective = {
          host: opts.host ?? '(?)',
          port: opts.port ?? -1,
          tls: Boolean(opts.tls),
          family: typeof opts.family === 'number' ? opts.family : null,
        };

        return client;
      },
    },
  ],
  exports: [REDIS, REDIS_HEALTH],
})
export class RedisModule {}
