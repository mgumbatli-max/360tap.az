import { Test } from '@nestjs/testing';
import { GeoService } from './geo.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('GeoService.resolveNearest', () => {
  const districts = [
    { id: 'q', slug: 'qebele-merkez', nameAz: 'Qəbələ mərkəz', lat: 40.9803, lng: 47.8456, region: { slug: 'qebele', nameAz: 'Qəbələ' } },
    { id: 'b', slug: 'baki-nesimi', nameAz: 'Nəsimi', lat: 40.38, lng: 49.84, region: { slug: 'baki', nameAz: 'Bakı' } },
  ];
  let service: GeoService;

  beforeEach(async () => {
    const mod = await Test.createTestingModule({
      providers: [
        GeoService,
        {
          provide: PrismaService,
          useValue: { district: { findMany: async () => districts } },
        },
      ],
    }).compile();
    service = mod.get(GeoService);
  });

  it('Qəbələ koordinatı ən yaxın region kimi qebele qaytarır', async () => {
    const r = await service.resolveNearest(40.98, 47.84);
    expect(r.regionSlug).toBe('qebele');
    expect(r.distanceKm).toBeLessThan(5);
  });
});
