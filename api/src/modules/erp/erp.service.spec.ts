import { Test } from '@nestjs/testing';
import { ErpService } from './erp.service';
import { PrismaService } from '../../prisma/prisma.service';
import { SearchService } from '../../search/search.service';
import type { ErpIntegrationCtx } from './erp-auth.guard';
import type { ErpPublishDto } from './dto/erp-publish.dto';

const INTEGRATION: ErpIntegrationCtx = {
  id: 'int-1',
  store: { id: 'store-1', ownerId: 'owner-1', isVerified: true },
};

describe('ErpService.publish', () => {
  it('naməlum kateqoriya → BadRequestException + sync log error', async () => {
    let logged: { status?: string } = {};
    const prisma = {
      category: { findUnique: async () => null },
      erpSyncLog: {
        create: async (args: { data: { status: string } }) => {
          logged = args.data;
          return {};
        },
      },
    };
    const mod = await Test.createTestingModule({
      providers: [
        ErpService,
        { provide: PrismaService, useValue: prisma },
        { provide: SearchService, useValue: { indexListing: async () => {}, removeListing: async () => {} } },
      ],
    }).compile();
    const svc = mod.get(ErpService);

    const dto = {
      external_id: 'X-1',
      category: 'yoxdur',
      title: 'Test məhsul',
      description: 'On simvoldan uzun təsvir',
    } as ErpPublishDto;

    await expect(svc.publish(INTEGRATION, dto)).rejects.toThrow('Kateqoriya tapılmadı');
    expect(logged.status).toBe('error');
  });
});
