import { ServiceUnavailableException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { REDIS } from '../redis/redis.module';
import { SearchService } from '../search/search.service';
import { HealthController } from './health.controller';

type PrismaStub = Pick<PrismaService, 'ping' | 'getDbStatus'>;
type SearchStub = Pick<SearchService, 'getStatus'>;

async function build(prisma: PrismaStub, search: SearchStub, redisStatus?: string) {
  const mod = await Test.createTestingModule({
    controllers: [HealthController],
    providers: [
      { provide: PrismaService, useValue: prisma },
      { provide: SearchService, useValue: search },
      { provide: REDIS, useValue: redisStatus ? { status: redisStatus } : undefined },
    ],
  }).compile();
  return mod.get(HealthController);
}

const searchOk: SearchStub = {
  getStatus: () => ({ status: 'available', configured: true, lastError: null }),
};
const searchDegraded: SearchStub = {
  getStatus: () => ({ status: 'degraded', configured: true, lastError: 'ECONNREFUSED' }),
};

describe('HealthController', () => {
  describe('GET /health (liveness)', () => {
    it('DB düşəndə belə 200/ok=true qaytarır — restart döngəsinin qarşısını alır', async () => {
      const ctrl = await build(
        {
          ping: async () => false,
          getDbStatus: () => ({ status: 'disconnected', lastError: 'connect ETIMEDOUT' }),
        },
        searchDegraded,
      );
      const res = ctrl.check();
      expect(res.ok).toBe(true);
      expect(res.service).toBe('360tap.az api');
      expect(typeof res.uptimeSec).toBe('number');
    });
  });

  describe('GET /health/ready (readiness)', () => {
    it('DB hazırdırsa ok=true', async () => {
      const ctrl = await build(
        { ping: async () => true, getDbStatus: () => ({ status: 'connected', lastError: null }) },
        searchOk,
        'ready',
      );
      const res = await ctrl.ready();
      expect(res.ok).toBe(true);
      expect(res.dependencies.database.ok).toBe(true);
      expect(res.dependencies.search.ok).toBe(true);
      expect(res.dependencies.redis.ok).toBe(true);
    });

    it('Search DEGRADED olsa da hazır sayılır (opsional asılılıq)', async () => {
      const ctrl = await build(
        { ping: async () => true, getDbStatus: () => ({ status: 'connected', lastError: null }) },
        searchDegraded,
      );
      const res = await ctrl.ready();
      expect(res.ok).toBe(true);
      expect(res.dependencies.search.required).toBe(false);
      expect(res.dependencies.search.ok).toBe(false);
      expect(res.dependencies.search.status).toBe('degraded');
    });

    it('DB düşəndə 503 atır (məcburi asılılıq)', async () => {
      const ctrl = await build(
        {
          ping: async () => false,
          getDbStatus: () => ({ status: 'disconnected', lastError: 'connect ETIMEDOUT' }),
        },
        searchOk,
      );
      await expect(ctrl.ready()).rejects.toBeInstanceOf(ServiceUnavailableException);
    });
  });
});
