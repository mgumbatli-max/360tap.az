import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        // Əvvəl URL parse edilib yalnız host+port götürülürdü — istifadəçi adı,
        // parol və `rediss://` (TLS) İTİRDİ. Managed Redis-də (Upstash/Render Key
        // Value, bax .env.production.example) bu, NOAUTH/TLS xətası deməkdir.
        // BullMQ ≥5 `connection.url` sahəsini birbaşa dəstəkləyir
        // (redis-connection: `new IORedis(url, rest)`), ona görə tam URL ötürülür.
        // Rədd edilən alternativ — host/port/username/password/tls sahələrini əl ilə
        // doldurmaq: eyni nəticəni verir, amma URL sintaksisinin (db indeksi, query
        // parametrləri) idarəsini bizim üzərimizə atır.
        return {
          connection: {
            url: config.get<string>('redisUrl') ?? 'redis://localhost:6379',
          },
        };
      },
    }),
  ],
  exports: [BullModule],
})
export class QueueModule {}
