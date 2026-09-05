import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SearchService } from './search.service';
import { PrismaService } from '../prisma/prisma.service';

describe('SearchService.understand', () => {
  let svc: SearchService;

  beforeEach(async () => {
    const mod = await Test.createTestingModule({
      providers: [
        SearchService,
        { provide: PrismaService, useValue: {} },
        {
          provide: ConfigService,
          useValue: { get: () => ({ host: 'http://localhost:7700', key: '' }) },
        },
      ],
    }).compile();
    svc = mod.get(SearchService);
  });

  it('"iphone qebele" → region=qebele, query=iphone', () => {
    const r = svc.understand('iphone qebele');
    expect(r.detectedRegion).toBe('qebele');
    expect(r.cleaned).toBe('iphone');
  });

  it('transliterasiya: "masin baki" → maşın + region=baki', () => {
    const r = svc.understand('masin baki');
    expect(r.detectedRegion).toBe('baki');
    expect(r.cleaned).toContain('maşın');
  });

  // Yerlik/çıxışlıq halı — «Bakıda», «Gəncədə» əvvəl tanınmırdı (0 nəticə).
  it.each([
    ['Bakıda ev', 'baki', 'ev'],
    ['Gəncədə', 'gence', ''],
    ['Şəkidə', 'seki', ''],
    ['bakidan', 'baki', ''],
    ['gencede', 'gence', ''],
    ['qubaya', 'quba', ''],
  ])('hal şəkilçisi: "%s" → region=%s', (q, region, cleaned) => {
    const r = svc.understand(q);
    expect(r.detectedRegion).toBe(region);
    expect(r.cleaned).toBe(cleaned);
  });

  // Böyük hərflə yazılış: 'İ' kiçildikdə i + U+0307 verirdi və heç nə tapılmırdı.
  it.each([
    ['MƏNZİL', 'mənzil'],
    ['İphone', 'iphone'],
    ['MAŞINLARI', 'maşinlari'],
  ])('böyük hərf normalizasiyası: "%s" → "%s"', (q, expected) => {
    expect(svc.understand(q).cleaned).toBe(expected);
  });

  // Adi söz təsadüfən region kimi oxunmamalıdır (şəkilçi soyma yalnız
  // lüğətdəki kökə düşdükdə tətbiq olunur).
  it('adi söz region kimi tanınmır: "kirayə evdə"', () => {
    const r = svc.understand('kirayə evdə');
    expect(r.detectedRegion).toBeNull();
    expect(r.cleaned).toBe('kirayə evdə');
  });
});
