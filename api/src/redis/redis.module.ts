import { Global, Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export const REDIS = 'REDIS';

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
      provide: REDIS,
      inject: [ConfigService],
      useFactory: (config: ConfigService): Redis => {
        const logger = new Logger('Redis');
        const client = new Redis(config.get<string>('redisUrl') ?? 'redis://localhost:6379', {
          // Sonsuz növbə YOX — Redis əlçatmazdırsa əmrlər dərhal rədd olunsun.
          maxRetriesPerRequest: 2,
          enableOfflineQueue: false,
          connectTimeout: 5_000,
          // Yenidən qoşulma cəhdləri arasında artan gecikmə (maks 10s).
          retryStrategy: (times) => Math.min(times * 500, 10_000),
        });

        let loggedDown = false;
        client.on('error', (err: Error) => {
          if (!loggedDown) {
            loggedDown = true;
            logger.warn(`Redis əlçatmazdır (degraded): ${err.message}`);
          }
        });
        client.on('ready', () => {
          loggedDown = false;
          logger.log('Redis qoşuldu');
        });

        return client;
      },
    },
  ],
  exports: [REDIS],
})
export class RedisModule {}
