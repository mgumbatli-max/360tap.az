import { Test } from '@nestjs/testing';
import { ExpiryAlertsService } from './expiry.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

/**
 * MÜDDƏT XATIRLATMASI — ƏSAS RİSK: KÜTLƏVİ BİLDİRİŞ.
 *
 * DAVAM.md canlıda kataloqun böyük hissəsinin `expiresAt`-ının KEÇMİŞ olduğunu
 * qeyd edir (sahə heç yerdə tətbiq olunmadığı üçün). Əgər cron onları da götürsəydi,
 * ilk işə düşmədə minlərlə istifadəçiyə eyni anda bildiriş gedərdi — geri
 * qaytarıla bilməyən zərər.
 *
 * Ona görə bu testlərin əsas hissəsi «bildiriş NƏ VAXT GETMƏMƏLİDİR» sualını qoruyur.
 */

type Listing = { id: string; ownerId: string; title: string; expiresAt: Date };

function makeModule(listings: Listing[], recentNotifiedListingIds: string[] = []) {
  const created: { userId: string; type: string; title: string; data?: unknown }[] = [];
  let capturedWhere: Record<string, unknown> = {};

  const prisma = {
    listing: {
      findMany: async (args: { where: Record<string, unknown> }) => {
        capturedWhere = args.where;
        return listings;
      },
    },
    notification: {
      findMany: async () => recentNotifiedListingIds.map((id) => ({ data: { listingId: id } })),
    },
  };

  const notifications = {
    create: async (userId: string, type: string, title: string, _b?: string, data?: unknown) => {
      created.push({ userId, type, title, data });
    },
  };

  return { prisma, notifications, created, where: () => capturedWhere };
}

async function makeService(listings: Listing[], recent: string[] = []) {
  const m = makeModule(listings, recent);
  const mod = await Test.createTestingModule({
    providers: [
      ExpiryAlertsService,
      { provide: PrismaService, useValue: m.prisma },
      { provide: NotificationsService, useValue: m.notifications },
    ],
  }).compile();
  return { svc: mod.get(ExpiryAlertsService), ...m };
}

const DAY = 86_400_000;

describe('ExpiryAlertsService.run', () => {
  it('3 gün içində bitəcək elanın sahibinə xatırlatma göndərir', async () => {
    const { svc, created } = await makeService([
      { id: 'l1', ownerId: 'u1', title: 'iPhone 14', expiresAt: new Date(Date.now() + 2 * DAY) },
    ]);

    const res = await svc.run();

    expect(created).toHaveLength(1);
    expect(created[0].userId).toBe('u1');
    expect(created[0].type).toBe('listing_expiring');
    expect(created[0].title).toContain('iPhone 14');
    expect(res.notified).toBe(1);
  });

  it('VAXTI KEÇMİŞ elanları sorğuya ümumiyyətlə daxil etmir (kütləvi bildiriş qoruması)', async () => {
    const { svc, where } = await makeService([]);
    await svc.run();

    // Sorğunun ÖZÜ vaxtı keçmişləri kənarlaşdırmalıdır — nəticəni sonradan
    // süzmək kifayət deyil, çünki minlərlə sətir bazadan çəkilərdi.
    const expires = where().expiresAt as { gt?: Date; lte?: Date };
    expect(expires).toBeDefined();
    expect(expires.gt).toBeInstanceOf(Date);
    expect(expires.gt!.getTime()).toBeGreaterThanOrEqual(Date.now() - 5000);
    expect(expires.lte).toBeInstanceOf(Date);
  });

  it('yalnız aktiv elanlara baxır', async () => {
    const { svc, where } = await makeService([]);
    await svc.run();
    expect(where().status).toBe('active');
  });

  it('son 7 gündə artıq xatırladılmış elan üçün TƏKRAR bildiriş göndərmir', async () => {
    const { svc, created } = await makeService(
      [{ id: 'l1', ownerId: 'u1', title: 'Mənzil', expiresAt: new Date(Date.now() + DAY) }],
      ['l1'],
    );

    await svc.run();

    expect(created).toHaveLength(0);
  });

  it('təkrar siyahısında olmayan elan üçün bildiriş göndərir', async () => {
    const { svc, created } = await makeService(
      [
        { id: 'l1', ownerId: 'u1', title: 'Köhnə', expiresAt: new Date(Date.now() + DAY) },
        { id: 'l2', ownerId: 'u2', title: 'Yeni', expiresAt: new Date(Date.now() + DAY) },
      ],
      ['l1'],
    );

    await svc.run();

    expect(created).toHaveLength(1);
    expect(created[0].userId).toBe('u2');
  });

  it('uyğun elan yoxdursa səssizcə bitir', async () => {
    const { svc, created } = await makeService([]);
    const res = await svc.run();
    expect(created).toHaveLength(0);
    expect(res.notified).toBe(0);
  });

  it('bir bildirişin xətası qalanları dayandırmır', async () => {
    const created: string[] = [];
    let call = 0;
    const mod = await Test.createTestingModule({
      providers: [
        ExpiryAlertsService,
        {
          provide: PrismaService,
          useValue: {
            listing: {
              findMany: async () => [
                { id: 'l1', ownerId: 'u1', title: 'A', expiresAt: new Date(Date.now() + DAY) },
                { id: 'l2', ownerId: 'u2', title: 'B', expiresAt: new Date(Date.now() + DAY) },
              ],
            },
            notification: { findMany: async () => [] },
          },
        },
        {
          provide: NotificationsService,
          useValue: {
            create: async (userId: string) => {
              call += 1;
              if (call === 1) throw new Error('birinci sındı');
              created.push(userId);
            },
          },
        },
      ],
    }).compile();

    const svc = mod.get(ExpiryAlertsService);
    const res = await svc.run();

    expect(created).toEqual(['u2']);
    expect(res.failed).toBe(1);
  });
});
