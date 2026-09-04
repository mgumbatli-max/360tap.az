import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { encode } from 'blurhash';
import { randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import type { AppConfig } from '../config/configuration';

export interface UploadedMedia {
  url: string;
  width: number;
  height: number;
  blurHash: string;
}

export interface IncomingFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
}

/**
 * Real telefon şəkli 50 MP-i keçmir. Limitsiz dekod "piksel bombası"na yol verirdi:
 * 2.4 MB-lıq, lakin 98 MP-lik PNG tək sorğuda +520 MB RSS yaradıb 512 MB-lıq Render
 * instansını OOM edirdi. Bayt limiti (controller-də 8 MB) bunu tutmur — piksel sayı ayrıca limitdir.
 */
const MAX_INPUT_PIXELS = 50_000_000;

/** Saxlanan şəklin maksimum kənarı — vitrin üçün 2560 px kifayətdir, dekoddan sonrakı yaddaşı da sabitləyir. */
const MAX_OUTPUT_EDGE = 2560;

@Injectable()
export class MediaService {
  private readonly dir: string;
  private readonly baseUrl: string;

  constructor(config: ConfigService<AppConfig, true>) {
    const media = config.get('media', { infer: true });
    this.dir = media.dir;
    this.baseUrl = media.baseUrl;
  }

  /**
   * Şəkildən blurhash (placeholder) yaradır.
   * Piksel limiti burada da lazımdır: metod public-dir və xam istifadəçi buffer-i ilə çağırıla bilər —
   * 32x32-yə resize dekodu ucuzlaşdırmır, PNG-də tam ölçülü dekod yenə də baş verir.
   */
  async toBlurhash(buffer: Buffer): Promise<string> {
    const { data, info } = await sharp(buffer, { limitInputPixels: MAX_INPUT_PIXELS })
      .raw()
      .ensureAlpha()
      .resize(32, 32, { fit: 'inside' })
      .toBuffer({ resolveWithObject: true });
    return encode(new Uint8ClampedArray(data), info.width, info.height, 4, 4);
  }

  /**
   * Faylı təhlükəsiz yenidən kodlaşdırıb (webp) yerli storage-a yazır.
   * SVG və qeyri-şəkil rədd olunur; ölçü/tip yoxlaması controller-də (Multer).
   */
  async upload(file: IncomingFile): Promise<UploadedMedia> {
    let meta: sharp.Metadata;
    try {
      // metadata() yalnız başlığı oxuyur, piksel dekod etmir — ona görə burada limit yumşaqdır.
      // Sərt piksel yoxlamasını aşağıda özümüz edirik ki, istifadəçi "oxunmadı" yerinə aydın səbəb görsün.
      meta = await sharp(file.buffer, { limitInputPixels: false }).metadata();
    } catch {
      throw new BadRequestException('Şəkil oxunmadı');
    }
    if (!meta.format || meta.format === 'svg') {
      throw new BadRequestException('Bu şəkil formatı dəstəklənmir');
    }
    // Dekoddan ƏVVƏL rədd et — dekod başlayandan sonra yaddaş artıq ayrılmış olur
    if ((meta.width ?? 0) * (meta.height ?? 0) > MAX_INPUT_PIXELS) {
      throw new BadRequestException('Şəkil ölçüsü çox böyükdür (maksimum 50 meqapiksel)');
    }

    // Xam buffer-i yox, sharp ilə yenidən kodlaşdırılmış webp-i yaz (payload təmizliyi).
    // resize həm diskdəki ölçünü, həm də dekoddan sonrakı pik yaddaşı sabit saxlayır.
    const output = await sharp(file.buffer, { limitInputPixels: MAX_INPUT_PIXELS })
      .rotate()
      .resize(MAX_OUTPUT_EDGE, MAX_OUTPUT_EDGE, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer({ resolveWithObject: true });

    // Blurhash artıq kiçildilmiş webp-dən alınır ki, tam ölçülü dekod ikinci dəfə baş verməsin
    const blurHash = await this.toBlurhash(output.data);

    const name = `${randomUUID()}.webp`;
    await fs.mkdir(this.dir, { recursive: true });
    await fs.writeFile(join(this.dir, name), output.data);

    return {
      url: `${this.baseUrl}/${name}`,
      // Diskdəki faylın həqiqi ölçüsü — resize/rotate-dan sonrakı dəyər (meta orijinalı göstərirdi)
      width: output.info.width,
      height: output.info.height,
      blurHash,
    };
  }
}
