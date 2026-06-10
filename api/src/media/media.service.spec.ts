import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import sharp from 'sharp';
import { MediaService } from './media.service';

describe('MediaService.toBlurhash', () => {
  let service: MediaService;

  beforeEach(async () => {
    const mod = await Test.createTestingModule({
      providers: [
        MediaService,
        {
          provide: ConfigService,
          useValue: { get: () => ({ dir: './uploads', baseUrl: 'http://localhost:5500/uploads' }) },
        },
      ],
    }).compile();
    service = mod.get(MediaService);
  });

  it('şəkildən qeyri-boş blurhash qaytarır', async () => {
    const img = await sharp({
      create: { width: 16, height: 16, channels: 3, background: { r: 200, g: 30, b: 30 } },
    })
      .png()
      .toBuffer();
    const hash = await service.toBlurhash(img);
    expect(typeof hash).toBe('string');
    expect(hash.length).toBeGreaterThan(6);
  });
});
