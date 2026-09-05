import { Test } from '@nestjs/testing';
import { SavedSearchAlertsService } from './saved-search.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ListingsService } from '../listings/listings.service';
import { NotificationsService } from '../notifications/notifications.service';

/**
 * SAXLANMIŞ AXTARIŞ UYĞUNLAŞDIRICISI.
 *
 * Bu servis periodik işləyir və istifadəçiyə bildiriş göndərir — yəni səhvi
 * BİRBAŞA istifadəçiyə çatır (yanlış və ya təkrar bildiriş). Ona görə testlər
 * «uğurlu hal»dan çox kənar halları qoruyur: bildiriş NƏ VAXT getməməlidir.
 */

type Row = {
  id: string;
  userId: string;
  name: string | null;
  query: Record<string, unknown>;
  lastNotifiedAt: Date | null;
  createdAt: Date;
};

function buildModule(rows: Row[], listings: { id: string; publishedAt: Date | null }[]) {
  const created: { userId: string; type: string; title: string; data?: unknown }[] = [];
  const updated: { id: string; lastNotifiedAt: Date }[] = [];

  const prisma = {
    savedSearch: {
      findMany: async () => rows,
      update: async (args: { where: { id: string }; data: { lastNotifiedAt: Date } }) => {
        updated.push({ id: args.where.id, lastNotifiedAt: args.data.lastNotifiedAt });
        return {};
      },
    },
  };

  const listingsService = {
    findAll: async () => ({ data: listings, meta: { total: listings.length } }),
  };

  const notifications = {
    create: async (userId: string, type: string, title: string, _body?: string, data?: unknown) => {
      created.push({ userId, type, title, data });
    },
  };

  return { prisma, listingsService, notifications, created, updated };
}

async function makeService(rows: Row[], listings: { id: string; publishedAt: Date | null }[]) {
  const m = buildModule(rows, listings);
  const mod = await Test.createTestingModule({
    providers: [
      SavedSearchAlertsService,
      { provide: PrismaService, useValue: m.prisma },
      { provide: ListingsService, useValue: m.listingsService },
      { provide: NotificationsService, useValue: m.notifications },
    ],
  }).compile();
  return { svc: mod.get(SavedSearchAlertsService), ...m };
}

const HOUR = 3600_000;

describe('SavedSearchAlertsService.run', () => {
  it('sonuncu bildirişdən sonra dərc olunmuş elan varsa bildiriş yaradır', async () => {
    const lastNotified = new Date(Date.now() - 5 * HOUR);
    const { svc, created, updated } = await makeService(
      [{ id: 's1', userId: 'u1', name: 'BMW axtarışı', query: { category: 'avtomobiller' }, lastNotifiedAt: lastNotified, createdAt: new Date(0) }],
      [{ id: 'l1', publishedAt: new Date(Date.now() - HOUR) }],
    );

    const res = await svc.run();

    expect(created).toHaveLength(1);
    expect(created[0].userId).toBe('u1');
    expect(created[0].type).toBe('saved_search');
    expect(created[0].title).toContain('BMW axtarışı');
    expect(updated).toHaveLength(1);
    expect(res.notified).toBe(1);
  });

  it('KÖHNƏ elanlar üçün bildiriş YARATMIR — yalnız sonuncu bildirişdən sonrakılar sayılır', async () => {
    const lastNotified = new Date(Date.now() - HOUR);
    const { svc, created, updated } = await makeService(
      [{ id: 's1', userId: 'u1', name: null, query: {}, lastNotifiedAt: lastNotified, createdAt: new Date(0) }],
      [{ id: 'l1', publishedAt: new Date(Date.now() - 10 * HOUR) }],
    );

    await svc.run();

    expect(created).toHaveLength(0);
    // Yeni elan yoxdursa tarix də yenilənməməlidir — əks halda növbəti dövrədə
    // aralıqda yaranan elanlar «görünməz» qalardı.
    expect(updated).toHaveLength(0);
  });

  it('heç bir elan tapılmasa bildiriş yaratmır', async () => {
    const { svc, created } = await makeService(
      [{ id: 's1', userId: 'u1', name: null, query: {}, lastNotifiedAt: null, createdAt: new Date(0) }],
      [],
    );
    await svc.run();
    expect(created).toHaveLength(0);
  });

  it('`lastNotifiedAt` boşdursa `createdAt`-dan sonrakı elanlara baxır', async () => {
    const createdAt = new Date(Date.now() - 3 * HOUR);
    const { svc, created } = await makeService(
      [{ id: 's1', userId: 'u1', name: null, query: {}, lastNotifiedAt: null, createdAt }],
      [{ id: 'l1', publishedAt: new Date(Date.now() - HOUR) }],
    );
    await svc.run();
    expect(created).toHaveLength(1);
  });

  it('`publishedAt` boş olan elanı saymır — dərc tarixi yoxdursa yeni sayıla bilməz', async () => {
    const { svc, created } = await makeService(
      [{ id: 's1', userId: 'u1', name: null, query: {}, lastNotifiedAt: new Date(Date.now() - HOUR), createdAt: new Date(0) }],
      [{ id: 'l1', publishedAt: null }],
    );
    await svc.run();
    expect(created).toHaveLength(0);
  });

  it('bir axtarış sınsa digərləri işləməyə davam edir', async () => {
    const rows: Row[] = [
      { id: 's1', userId: 'u1', name: null, query: {}, lastNotifiedAt: null, createdAt: new Date(0) },
      { id: 's2', userId: 'u2', name: null, query: {}, lastNotifiedAt: null, createdAt: new Date(0) },
    ];
    const created: { userId: string }[] = [];
    let call = 0;
    const mod = await Test.createTestingModule({
      providers: [
        SavedSearchAlertsService,
        {
          provide: PrismaService,
          useValue: { savedSearch: { findMany: async () => rows, update: async () => ({}) } },
        },
        {
          provide: ListingsService,
          useValue: {
            findAll: async () => {
              call += 1;
              if (call === 1) throw new Error('birinci axtarış sındı');
              return { data: [{ id: 'l1', publishedAt: new Date() }], meta: {} };
            },
          },
        },
        {
          provide: NotificationsService,
          useValue: { create: async (userId: string) => void created.push({ userId }) },
        },
      ],
    }).compile();

    const svc = mod.get(SavedSearchAlertsService);
    const res = await svc.run();

    expect(created).toHaveLength(1);
    expect(created[0].userId).toBe('u2');
    expect(res.failed).toBe(1);
  });

  it('heç bir axtarış yoxdursa səssizcə bitir', async () => {
    const { svc, created } = await makeService([], []);
    const res = await svc.run();
    expect(created).toHaveLength(0);
    expect(res.checked).toBe(0);
  });
});
