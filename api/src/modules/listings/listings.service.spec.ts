import { Test } from '@nestjs/testing';
import { ListingsService } from './listings.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CategoriesService } from '../categories/categories.service';

describe('ListingsService.findAll', () => {
  let captured: { where?: Record<string, unknown> } = {};
  const prismaMock = {
    region: { findUnique: async () => ({ isActive: true, districts: [{ id: 'd1' }, { id: 'd2' }] }) },
    category: { findUnique: async () => null },
    listing: {
      findMany: async (args: { where: Record<string, unknown> }) => {
        captured = args;
        return [];
      },
      count: async () => 0,
    },
    $transaction: async (ops: Promise<unknown>[]) => Promise.all(ops),
  };
  let service: ListingsService;

  beforeEach(async () => {
    captured = {};
    const mod = await Test.createTestingModule({
      providers: [
        ListingsService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: CategoriesService, useValue: {} },
      ],
    }).compile();
    service = mod.get(ListingsService);
  });

  it('region slug → rayon id-lərinə filter (yalnız active)', async () => {
    const res = await service.findAll({ region: 'qebele', page: 1, limit: 20 });
    expect(captured.where?.status).toBe('active');
    expect(captured.where?.districtId).toEqual({ in: ['d1', 'd2'] });
    expect(res.meta).toEqual({ page: 1, limit: 20, total: 0, hasMore: false });
  });

  it('qiymət aralığı gte/lte', async () => {
    await service.findAll({ priceMin: 100, priceMax: 500 });
    expect(captured.where?.price).toEqual({ gte: 100, lte: 500 });
  });

  it('mövcud olmayan region → NotFoundException', async () => {
    const mod = await Test.createTestingModule({
      providers: [
        ListingsService,
        { provide: PrismaService, useValue: { region: { findUnique: async () => null } } },
        { provide: CategoriesService, useValue: {} },
      ],
    }).compile();
    const svc = mod.get(ListingsService);
    await expect(svc.findAll({ region: 'yoxdur' })).rejects.toThrow('Region tapılmadı');
  });
});
