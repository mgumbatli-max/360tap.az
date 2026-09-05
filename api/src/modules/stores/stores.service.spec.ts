import { Test } from '@nestjs/testing';
import { StoresService } from './stores.service';
import { PrismaService } from '../../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';

/**
 * `StoresService` artıq `SettingsService`-dən asılıdır (`store.auto_approve`
 * bayrağı mağazanın başlanğıc statusunu təyin edir), ona görə DI mock-u da lazımdır.
 */
function settingsMock(autoApprove: boolean) {
  return { isEnabled: async () => autoApprove };
}

describe('StoresService.create', () => {
  it('istifadəçinin artıq mağazası varsa ConflictException atır', async () => {
    const mod = await Test.createTestingModule({
      providers: [
        StoresService,
        {
          provide: PrismaService,
          useValue: { store: { findUnique: async () => ({ id: 'existing' }) } },
        },
        { provide: SettingsService, useValue: settingsMock(true) },
      ],
    }).compile();
    const svc = mod.get(StoresService);
    await expect(svc.create('owner-1', { name: 'Test Mağaza' })).rejects.toThrow(
      'artıq mağazası var',
    );
  });

  it.each([
    [true, 'active'],
    [false, 'pending'],
  ])('store.auto_approve=%s → status %s', async (autoApprove, expected) => {
    let written: { status?: string } = {};
    const tx = {
      store: {
        create: async (args: { data: { status: string } }) => {
          written = args.data;
          return { id: 'store-1', slug: 'test-magaza', name: 'Test Mağaza' };
        },
      },
      user: { update: async () => undefined },
      auditLog: { create: async () => undefined },
    };
    const mod = await Test.createTestingModule({
      providers: [
        StoresService,
        {
          provide: PrismaService,
          useValue: {
            store: { findUnique: async () => null },
            $transaction: async (fn: (t: typeof tx) => Promise<unknown>) => fn(tx),
          },
        },
        { provide: SettingsService, useValue: settingsMock(autoApprove) },
      ],
    }).compile();

    await mod.get(StoresService).create('owner-1', { name: 'Test Mağaza' });
    expect(written.status).toBe(expected);
  });
});
