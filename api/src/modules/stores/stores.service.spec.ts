import { Test } from '@nestjs/testing';
import { StoresService } from './stores.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('StoresService.create', () => {
  it('istifadəçinin artıq mağazası varsa ConflictException atır', async () => {
    const mod = await Test.createTestingModule({
      providers: [
        StoresService,
        {
          provide: PrismaService,
          useValue: { store: { findUnique: async () => ({ id: 'existing' }) } },
        },
      ],
    }).compile();
    const svc = mod.get(StoresService);
    await expect(svc.create('owner-1', { name: 'Test Mağaza' })).rejects.toThrow(
      'artıq mağazası var',
    );
  });
});
