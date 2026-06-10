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
});
