import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { resolve } from 'node:path';
import 'reflect-metadata';
import { AppModule, TRUST_PROXY_HOPS } from './app.module';
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
  app.useStaticAssets(mediaDir, {
    prefix: '/uploads/',
    // Fayl adları dəyişməzdir (media.service.ts: `${randomUUID()}.webp`) — eyni ad
    // heç vaxt başqa məzmun almır, ona görə 1 illik immutable keş təhlükəsizdir.
    // Əvvəl `max-age=0` idi: brauzer və Next image optimizer hər baxışda revalidasiya
    // edirdi (Render-ə lüzumsuz sorğu + cold-start gecikməsi).
    maxAge: '365d',
    immutable: true,
    etag: true,
    // helmet aşağıda (:59) qeydiyyatdan keçdiyi üçün statik fayllara ÇATMIR.
    // Rədd edilən alternativ: helmet-i bu sətirdən əvvələ köçürmək — onda şəkillərə
    // CSP/COOP kimi siyasətlər də düşür və gələcəkdə başqa fayl tipi əlavə olunanda
    // davranış gözlənilmədən dəyişir. Ona görə yalnız media üçün REAL lazım olan iki
    // başlıq əl ilə verilir (crossOriginResourcePolicy: 'cross-origin' konfiqurasiyası
    // məhz bunun üçün yazılmışdı).
    setHeaders: (res) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    },
  });

  // Proxy etibarı artıq kor-koranə deyil: sabit `1` birbaşa qoşulan müştərini də
  // "proxy" sayırdı, o da X-Forwarded-For yazaraq req.ip-i (deməli rate-limit açarını)
  // saxtalaşdıra bilirdi. İndi hop sayı TRUST_PROXY ilə idarə olunur — prod-da 1
  // (Render edge), lokalda 0. Mənbə: app.module.ts (throttle guard-la eyni dəyər).
  app.set('trust proxy', TRUST_PROXY_HOPS);

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
  //
  // `enableImplicitConversion` QƏSDƏN AÇIQ DEYİL — TİP QARIŞDIRMA DELİYİ İDİ.
  // O rejimdə class-transformer dəyəri validasiyadan ƏVVƏL DTO-nun elan olunmuş
  // tipinə zorla çevirir. Nəticədə `{"title":{"a":1}}` sorğusu `String({a:1})` →
  // `"[object Object]"` olurdu, `@IsString()` və `@Length(10,120)` yoxlamalarından
  // TƏMİZ keçirdi və bazaya belə yazılırdı (canlı sübut: bazada `[object Object]`
  // başlıqlı elan). Eyni delik BÜTÜN string sahələrə aid idi — massiv göndərmək də
  // "a,b,c" sətrinə çevrilirdi.
  //
  // Çıxarılması təhlükəsizdir, çünki çevirmə tələb edən yeganə yer query/param
  // sətirləridir və onlar ONSUZ DA açıq `@Type(() => Number)` işlədir
  // (query-listings.dto.ts, search.controller.ts, chat.controller.ts).
  // Gövdə DTO-ları isə JSON-dur — orada rəqəm/boolean artıq düzgün tiplə gəlir.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
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
      `TRUST_PROXY=${TRUST_PROXY_HOPS} hop · ` +
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
