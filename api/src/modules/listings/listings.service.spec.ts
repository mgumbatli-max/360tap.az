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

/**
 * SÜRƏTLİ FİLTRLƏR (QuickFilterChips).
 *
 * Ana səhifədəki 8 sürətli filtrdən 7-si backend-də MÖVCUD OLMAYAN parametrlər
 * göndərirdi və hamısı HTTP 422 verirdi — istifadəçi düyməyə basıb «elan tapılmadı»
 * görürdü (ölçüldü: has_delivery=1, sort=price_dropped, with_photo=1, sort=vip,
 * verified=1, sort=fast, ai=1 — hamısı 422).
 *
 * Data mövcudluğu ölçülüb: çatdırılma 17, şəkilli 107, VIP 4, təsdiqli mağaza 2 elan.
 * Real datası olmayan üçü (endirim/sürətli/AI) frontend-dən çıxarıldı — filtri
 * «işləyən» etmək, sonra həmişə boş nəticə vermək istifadəçini iki dəfə aldadardı.
 */
describe('ListingsService.findAll — sürətli filtrlər', () => {
  let captured: { where?: Record<string, unknown> } = {};
  let service: ListingsService;

  beforeEach(async () => {
    captured = {};
    const prismaMock = {
      region: { findUnique: async () => ({ isActive: true, districts: [] }) },
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

  it('hasDelivery=true → yalnız çatdırılması olanlar', async () => {
    await service.findAll({ hasDelivery: true });
    expect(captured.where?.hasDelivery).toBe(true);
  });

  it('withPhoto=true → yalnız ən azı bir şəkli olanlar', async () => {
    await service.findAll({ withPhoto: true });
    expect(captured.where?.images).toEqual({ some: {} });
  });

  it('vip=true → yalnız VIP elanlar', async () => {
    await service.findAll({ vip: true });
    expect(captured.where?.isVip).toBe(true);
  });

  it('verified=true → yalnız təsdiqlənmiş mağazanın elanları', async () => {
    await service.findAll({ verified: true });
    expect(captured.where?.store).toEqual({ isVerified: true });
  });

  it('bayraq FALSE olanda filtr TƏTBİQ EDİLMİR — «çatdırılması olmayanlar» ayrı sorğudur', async () => {
    await service.findAll({ hasDelivery: false, withPhoto: false, vip: false, verified: false });
    expect(captured.where?.hasDelivery).toBeUndefined();
    expect(captured.where?.images).toBeUndefined();
    expect(captured.where?.isVip).toBeUndefined();
    expect(captured.where?.store).toBeUndefined();
  });

  it('bir neçə filtr birlikdə tətbiq olunur', async () => {
    await service.findAll({ hasDelivery: true, withPhoto: true });
    expect(captured.where?.hasDelivery).toBe(true);
    expect(captured.where?.images).toEqual({ some: {} });
  });

  it('hasCredit=true → yalnız kreditlə satılanlar', async () => {
    await service.findAll({ hasCredit: true });
    expect(captured.where?.hasCredit).toBe(true);
  });

  it('hasBarter=true → yalnız barterə açıq olanlar', async () => {
    await service.findAll({ hasBarter: true });
    expect(captured.where?.hasBarter).toBe(true);
  });

  /**
   * `onlyShops` və `verified` FƏRQLİ filtrlərdir və qarışdırılmamalıdır:
   *  · onlyShops — elan hər hansı mağazaya bağlıdır (fərdi satıcı deyil)
   *  · verified  — həmin mağaza TƏSDİQLƏNİB
   * Ölçüldü: mağazadan olan 3 elan var, təsdiqli mağazadan isə 2 — yəni birini
   * digərinin yerinə işlətmək nəticəni səssizcə dəyişərdi.
   */
  it('onlyShops=true → mağazaya bağlı elanlar (təsdiq şərti YOX)', async () => {
    await service.findAll({ onlyShops: true });
    expect(captured.where?.storeId).toEqual({ not: null });
    expect(captured.where?.store).toBeUndefined();
  });

  it('verified=true → mağaza təsdiqi tələb olunur (onlyShops-dan fərqli)', async () => {
    await service.findAll({ verified: true });
    expect(captured.where?.store).toEqual({ isVerified: true });
    expect(captured.where?.storeId).toBeUndefined();
  });
});
