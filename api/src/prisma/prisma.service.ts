import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/** DB bağlantısının cari vəziyyəti — /health/ready üçün. */
export type DbStatus = 'connected' | 'connecting' | 'disconnected';

/**
 * Faza 0 (production stabilization):
 * Əvvəl onModuleInit-də `await $connect()` çağırılırdı və DB əlçatmaz olduqda
 * exception atırdı → NestFactory.create() reject olurdu → `void bootstrap()`
 * unhandled rejection verirdi → proses çıxırdı → HTTP server HEÇ VAXT
 * `listen()`-ə çatmırdı. Nəticədə BÜTÜN API (o cümlədən /health) əlçatmaz olurdu.
 *
 * İndi: bağlantı uğursuz olsa belə proses qalxır (graceful degradation),
 * arxa planda eksponensial backoff ilə yenidən cəhd edilir, vəziyyət isə
 * /health/ready ilə xaricə bildirilir.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private status: DbStatus = 'disconnected';
  private lastError: string | null = null;
  private retryTimer: NodeJS.Timeout | null = null;
  private retryAttempt = 0;
  private destroyed = false;

  /** İlk bağlantı cəhdi üçün maksimum gözləmə — startup-ı bloklamamaq üçün. */
  private static readonly CONNECT_TIMEOUT_MS = 10_000;
  private static readonly RETRY_BASE_MS = 2_000;
  private static readonly RETRY_MAX_MS = 60_000;

  constructor() {
    super({
      log: [
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'warn' },
      ],
    });
  }

  async onModuleInit(): Promise<void> {
    // Bloklamır və ATMIR — uğursuzluqda arxa plan retry planlaşdırılır.
    await this.tryConnect();
  }

  async onModuleDestroy(): Promise<void> {
    this.destroyed = true;
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
    await this.$disconnect().catch(() => undefined);
  }

  /** DB hazırdırmı (readiness probe üçün). */
  getDbStatus(): { status: DbStatus; lastError: string | null } {
    return { status: this.status, lastError: this.lastError };
  }

  /** Canlı yoxlama — readiness endpoint-i bunu çağırır. */
  async ping(timeoutMs = 3_000): Promise<boolean> {
    try {
      await this.withTimeout(this.$queryRaw`SELECT 1`, timeoutMs, 'db ping');
      if (this.status !== 'connected') {
        this.status = 'connected';
        this.lastError = null;
      }
      return true;
    } catch (e) {
      this.status = 'disconnected';
      this.lastError = this.short(e);
      this.scheduleRetry();
      return false;
    }
  }

  private async tryConnect(): Promise<void> {
    if (this.destroyed) return;
    this.status = 'connecting';
    try {
      await this.withTimeout(this.$connect(), PrismaService.CONNECT_TIMEOUT_MS, 'db connect');
      this.status = 'connected';
      this.lastError = null;
      this.retryAttempt = 0;
      this.logger.log('Prisma DB-yə qoşuldu');
    } catch (e) {
      this.status = 'disconnected';
      this.lastError = this.short(e);
      this.logger.error(
        `Prisma DB bağlantısı alınmadı (API degraded rejimdə qalxır): ${this.lastError}`,
      );
      this.scheduleRetry();
    }
  }

  private scheduleRetry(): void {
    if (this.destroyed || this.retryTimer) return;
    const delay = Math.min(
      PrismaService.RETRY_BASE_MS * 2 ** this.retryAttempt,
      PrismaService.RETRY_MAX_MS,
    );
    this.retryAttempt += 1;
    this.retryTimer = setTimeout(() => {
      this.retryTimer = null;
      void this.tryConnect();
    }, delay);
    // Prosesi diri saxlamasın (graceful shutdown-a mane olmasın).
    this.retryTimer.unref?.();
    this.logger.warn(`DB-yə yenidən qoşulma ${Math.round(delay / 1000)}s sonra cəhd ediləcək`);
  }

  private async withTimeout<T>(p: PromiseLike<T>, ms: number, label: string): Promise<T> {
    let timer: NodeJS.Timeout | undefined;
    try {
      return await Promise.race([
        p,
        new Promise<never>((_, reject) => {
          timer = setTimeout(() => reject(new Error(`${label} timeout (${ms}ms)`)), ms);
          timer.unref?.();
        }),
      ]);
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  /** Xəta mətnini qısalt — connection string və s. loga tam düşməsin. */
  private short(e: unknown): string {
    const msg = e instanceof Error ? e.message : String(e);
    return msg.replace(/postgres(ql)?:\/\/[^\s"']+/gi, 'postgres://***').slice(0, 300);
  }

  /**
   * Test mühitində istifadə üçün — bütün cədvəlləri təmizlə.
   * Production-da ASLA çağırma.
   */
  async cleanDatabase(): Promise<void> {
    if (process.env.NODE_ENV !== 'test') {
      throw new Error('cleanDatabase yalnız test mühitində icazəlidir');
    }
    const tables = await this.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename FROM pg_tables WHERE schemaname='public'
    `;
    const names = tables.map((t) => `"public"."${t.tablename}"`).join(', ');
    if (names) {
      await this.$executeRawUnsafe(`TRUNCATE TABLE ${names} CASCADE;`);
    }
  }
}
