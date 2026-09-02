import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { resolve } from 'node:path';
import 'reflect-metadata';
import { AppModule } from './app.module';
import type { AppConfig } from './config/configuration';

const bootLogger = new Logger('Bootstrap');

/**
 * Faza 0 (observability): emal olunmamış xətalar səssiz çıxışa səbəb olurdu.
 * İndi hər ikisi loglanır; yalnız uncaughtException prosesi dayandırır
 * (unhandledRejection-da API degraded rejimdə işləməyə davam edir).
 */
function installProcessHandlers(): void {
  process.on('unhandledRejection', (reason) => {
    bootLogger.error(
      `Emal olunmamış Promise rejection (proses davam edir): ${
        reason instanceof Error ? `${reason.message}\n${reason.stack ?? ''}` : String(reason)
      }`,
    );
  });
  process.on('uncaughtException', (err) => {
    bootLogger.error(`Emal olunmamış exception — proses dayanır: ${err.message}\n${err.stack ?? ''}`);
    process.exit(1);
  });
}

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn', 'log'],
    rawBody: true, // ERP HMAC imza yoxlaması üçün xam body
  });

  const config = app.get(ConfigService<AppConfig, true>);
  const { port, cors } = {
    port: config.get('port', { infer: true }),
    cors: config.get('cors', { infer: true }),
  };

  // Media (Faza 0 — yerli fayl storage) statik serving: /uploads/*
  // MEDIA_DIR ilə eyni mənbə (storage ↔ serving uyğunluğu)
  const mediaDir = resolve(config.get('media', { infer: true }).dir);
  app.useStaticAssets(mediaDir, { prefix: '/uploads/' });

  // Render/Vercel proxy arxasında — real IP (rate-limit + loglama üçün)
  app.set('trust proxy', 1);

  // Şəkillə axtarış (base64) üçün böyük JSON body
  app.useBodyParser('json', { limit: '8mb' });

  // Təhlükəsizlik
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.enableCors({
    origin: cors.origins,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  });

  // Qlobal validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      errorHttpStatusCode: 422,
    }),
  );

  // health VƏ health/ready prefiksdən kənarda qalmalıdır (Render healthCheckPath=/health)
  app.setGlobalPrefix('api/v1', { exclude: ['health', 'health/ready'] });
  app.enableShutdownHooks();

  await app.listen(port);

  // Startup loqu — hansı asılılıqların konfiqurasiya olunduğu görünsün (SECRET YOX, yalnız var/yox)
  const meili = config.get('meili', { infer: true });
  const groq = config.get('groq', { infer: true });
  bootLogger.log(`🚀 360tap.az API dinləyir → port ${port}, prefiks /api/v1`);
  bootLogger.log(
    `Konfiqurasiya: NODE_ENV=${config.get('nodeEnv', { infer: true })} · ` +
      `DATABASE_URL=${process.env.DATABASE_URL ? 'set' : 'MISSING'} · ` +
      `REDIS_URL=${process.env.REDIS_URL ? 'set' : 'default(localhost)'} · ` +
      `MEILI_HOST=${meili.host ? (/localhost|127\.0\.0\.1/.test(meili.host) ? 'localhost(=yoxdur)' : 'set') : 'MISSING'} · ` +
      `GROQ_API_KEY=${groq.apiKey ? 'set' : 'MISSING(AI söndürülüb)'} · ` +
      `MEDIA_DIR=${mediaDir} · CORS=${cors.origins.length} origin`,
  );
}

installProcessHandlers();

bootstrap().catch((err: unknown) => {
  bootLogger.error(
    `API başladıla bilmədi: ${err instanceof Error ? `${err.message}\n${err.stack ?? ''}` : String(err)}`,
  );
  process.exit(1);
});
