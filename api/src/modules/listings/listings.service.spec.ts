import { Test } from '@nestjs/testing';
import { ListingsService } from './listings.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CategoriesService } from '../categories/categories.service';
import { SearchService } from '../../search/search.service';
import { ListingLimitService } from '../billing/listing-limit.service';
import { NotificationsService } from '../notifications/notifications.service';

// ListingsService konstruktoru SearchService (indeksləmə best-effort) və
// ListingLimitService (elan limiti yoxlaması) tələb edir. Mock olmadan Nest DI
// bu spec-i qırır — hər yeni asılılıq buraya da əlavə olunmalıdır.
const searchMock = {
  indexListing: async () => undefined,
  removeListing: async () => undefined,
};

// Limit mühərriki `findAll` yolunda ÇAĞIRILMIR (yalnız `create`-də), amma DI
// konstruktoru həll edə bilməsə modul ümumiyyətlə qurulmur.
const limitMock = {
  check: async () => ({ used: 0, limit: null, remaining: null, blocked: false, enforced: false }),
};

// `setStatus` sevimliyə salanlara bildiriş göndərir (listing_status), ona görə
// ListingsService artıq NotificationsService-dən də asılıdır. Aşağıdakı `setStatus`
// bloku öz mock-unu qurur; bu isə qalan testlər üçün susdurucudur.
const notificationsMock = { create: async () => undefined };

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
        { provide: SearchService, useValue: searchMock },
        { provide: ListingLimitService, useValue: limitMock },
        { provide: NotificationsService, useValue: notificationsMock },
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
        { provide: SearchService, useValue: searchMock },
        { provide: ListingLimitService, useValue: limitMock },
        { provide: NotificationsService, useValue: notificationsMock },
      ],
    }).compile();
    const svc = mod.get(ListingsService);
    await expect(svc.findAll({ region: 'yoxdur' })).rejects.toThrow('Region tapılmadı');
  });
});

/**
 * STATUS DƏYİŞİKLİYİ → SEVİMLİLƏRƏ BİLDİRİŞ.
 *
 * Elan `active`-dən çıxanda (satıldı/arxivləndi) onu sevimlilərə salmış istifadəçilər
 * bu barədə heç nə bilmirdi — kabinetlərində gözləməyə davam edirdilər.
 *
 * NİYƏ TESTLƏR BU HALLARA BAXIR: bildiriş kütləvi göndərilən şeydir, ona görə səhv
 * şərt yüzlərlə lazımsız bildiriş deməkdir. Xüsusilə: status DƏYİŞMƏYƏNDƏ və
 * elan yenidən aktivləşəndə bildiriş getməməlidir.
 */
describe('ListingsService.setStatus — sevimlilərə bildiriş', () => {
  function build(opts: {
    currentStatus: string;
    newStatus: string;
    favoriteUserIds: string[];
    ownerId?: string;
  }) {
    const created: { userId: string; type: string }[] = [];
    const ownerId = opts.ownerId ?? 'owner-1';

    const prismaMock = {
      listing: {
        findUnique: async () => ({ ownerId, status: opts.currentStatus, publishedAt: new Date() }),
        update: async () => ({
          id: 'l1',
          title: 'Test elan',
          slug: 'test-elan',
          images: [],
          category: null,
          district: null,
          status: opts.newStatus,
        }),
      },
      favorite: {
        findMany: async () => opts.favoriteUserIds.map((userId) => ({ userId })),
      },
    };

    const notificationsMock = {
      create: async (userId: string, type: string) => void created.push({ userId, type }),
    };

    return { prismaMock, notificationsMock, created, ownerId };
  }

  async function runSetStatus(b: ReturnType<typeof build>, newStatus: string) {
    const mod = await Test.createTestingModule({
      providers: [
        ListingsService,
        { provide: PrismaService, useValue: b.prismaMock },
        { provide: CategoriesService, useValue: {} },
        { provide: SearchService, useValue: searchMock },
        { provide: ListingLimitService, useValue: limitMock },
        { provide: NotificationsService, useValue: b.notificationsMock },
      ],
    }).compile();
    const svc = mod.get(ListingsService);
    await svc.setStatus(b.ownerId, 'l1', newStatus as never);
  }

  it('elan satıldıqda sevimliyə salanlara bildiriş göndərir', async () => {
    const b = build({ currentStatus: 'active', newStatus: 'sold', favoriteUserIds: ['u1', 'u2'] });
    await runSetStatus(b, 'sold');
    expect(b.created).toHaveLength(2);
    expect(b.created[0].type).toBe('listing_status');
  });

  it('elan sahibinin ÖZÜNƏ bildiriş göndərmir', async () => {
    const b = build({
      currentStatus: 'active',
      newStatus: 'sold',
      favoriteUserIds: ['owner-1', 'u2'],
      ownerId: 'owner-1',
    });
    await runSetStatus(b, 'sold');
    expect(b.created.map((c) => c.userId)).toEqual(['u2']);
  });

  it('status DƏYİŞMƏYƏNDƏ bildiriş göndərmir', async () => {
    const b = build({ currentStatus: 'active', newStatus: 'active', favoriteUserIds: ['u1'] });
    await runSetStatus(b, 'active');
    expect(b.created).toHaveLength(0);
  });

  it('elan yenidən AKTİVLƏŞƏNDƏ bildiriş göndərmir — bu, itki xəbəri deyil', async () => {
    const b = build({ currentStatus: 'archived', newStatus: 'active', favoriteUserIds: ['u1'] });
    await runSetStatus(b, 'active');
    expect(b.created).toHaveLength(0);
  });

  it('sevimliyə salan yoxdursa səssizcə keçir', async () => {
    const b = build({ currentStatus: 'active', newStatus: 'sold', favoriteUserIds: [] });
    await runSetStatus(b, 'sold');
    expect(b.created).toHaveLength(0);
  });
});
