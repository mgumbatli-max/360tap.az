import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { resolve } from 'node:path';
import 'reflect-metadata';
import { AppModule } from './app.module';
import type { AppConfig } from './config/configuration';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn', 'log'],
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

  app.setGlobalPrefix('api/v1', { exclude: ['health'] });
  app.enableShutdownHooks();

  await app.listen(port);
  const logger = new Logger('Bootstrap');
  logger.log(`🚀 Marketplace API → http://localhost:${port}/api/v1`);
}

void bootstrap();
