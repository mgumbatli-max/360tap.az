import { Injectable } from '@nestjs/common';
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

@Injectable()
export class MediaService {
  private readonly dir: string;
  private readonly baseUrl: string;

  constructor(config: ConfigService<AppConfig, true>) {
    const media = config.get('media', { infer: true });
    this.dir = media.dir;
    this.baseUrl = media.baseUrl;
  }

  /** Şəkildən blurhash (placeholder) yaradır. */
  async toBlurhash(buffer: Buffer): Promise<string> {
    const { data, info } = await sharp(buffer)
      .raw()
      .ensureAlpha()
      .resize(32, 32, { fit: 'inside' })
      .toBuffer({ resolveWithObject: true });
    return encode(new Uint8ClampedArray(data), info.width, info.height, 4, 4);
  }

  /** Faylı yerli storage-a yazır, metadata + blurhash qaytarır. */
  async upload(file: IncomingFile): Promise<UploadedMedia> {
    const meta = await sharp(file.buffer).metadata();
    const blurHash = await this.toBlurhash(file.buffer);
    const ext = meta.format ?? 'jpg';
    const name = `${randomUUID()}.${ext}`;
    await fs.mkdir(this.dir, { recursive: true });
    await fs.writeFile(join(this.dir, name), file.buffer);
    return {
      url: `${this.baseUrl}/${name}`,
      width: meta.width ?? 0,
      height: meta.height ?? 0,
      blurHash,
    };
  }
}
