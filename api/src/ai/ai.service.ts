import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Prisma } from '@prisma/client';
import type { AppConfig } from '../config/configuration';
import { PrismaService } from '../prisma/prisma.service';
import { toListingResponse } from '../modules/listings/dto/listing-response.dto';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

const SEARCH_SYSTEM = `Sən 360tap.az marketplace üçün axtarış köməkçisisən. İstifadəçinin təbii dil sorğusundan struktur filter çıxar.
YALNIZ JSON obyekt qaytar (başqa mətn yox):
{
  "keywords": "əsas axtarış sözləri — brend+model (məs. iPhone 14 Pro)",
  "region": "region slug və ya null (baki, sumqayit, gence, qebele, quba, xacmaz, lenkeran, seki, mingecevir, shamaxi, masalli, oguz, ismayilli, goycay, qax)",
  "vertical": "transport | realestate | job | universal | null",
  "category": "kateqoriya slug və ya null (telefonlar, avtomobiller, menziller, ...)",
  "brand": "brend və ya null",
  "color": "rəng və ya null",
  "condition": "Yeni | İşlənmiş | null",
  "priceMin": number | null,
  "priceMax": number | null
}
Region adlarını AZ-də tanı (qəbələ→qebele, gəncə→gence). Qiyməti manatla anla ("2000 manata qədər" → priceMax:2000). "təmirsiz/təmirdə olmamış/yeni kimi" → condition. Bilmədiyini null qoy.`;

export interface SearchUnderstanding {
  keywords?: string | null;
  region?: string | null;
  vertical?: string | null;
  category?: string | null;
  brand?: string | null;
  color?: string | null;
  condition?: string | null;
  priceMin?: number | null;
  priceMax?: number | null;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger('AiService');
  private readonly apiKey: string;
  private readonly model: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService<AppConfig, true>,
  ) {
    const g = config.get('groq', { infer: true });
    this.apiKey = g.apiKey;
    this.model = g.model;
  }

  get enabled(): boolean {
    return !!this.apiKey;
  }

  private async groqJSON(system: string, user: string): Promise<Record<string, unknown>> {
    if (!this.enabled) {
      throw new BadRequestException('AI konfiqurasiya olunmayıb (GROQ_API_KEY təyin edin)');
    }
    let res: Response;
    try {
      res = await fetch(GROQ_URL, {
        method: 'POST',
        headers: { Authorization: `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.2,
          max_tokens: 800,
        }),
      });
    } catch (e) {
      this.logger.warn(`Groq fetch alınmadı: ${String(e)}`);
      throw new BadRequestException('AI xidmətinə qoşulmaq alınmadı');
    }
    if (!res.ok) {
      this.logger.warn(`Groq ${res.status}: ${await res.text().catch(() => '')}`);
      throw new BadRequestException(`AI xətası (${res.status})`);
    }
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const content = data.choices?.[0]?.message?.content ?? '{}';
    try {
      return JSON.parse(content) as Record<string, unknown>;
    } catch {
      return {};
    }
  }

  // ---- AI axtarış: təbii dil → filter → nəticələr ----
  async aiSearch(query: string) {
    const u = (await this.groqJSON(SEARCH_SYSTEM, query)) as SearchUnderstanding;

    const where: Prisma.ListingWhereInput = { status: 'active' };

    if (u.region) {
      const region = await this.prisma.region.findUnique({
        where: { slug: u.region },
        select: { districts: { select: { id: true } } },
      });
      if (region) where.districtId = { in: region.districts.map((d) => d.id) };
    }
    if (u.vertical) where.vertical = u.vertical;
    if (u.category) {
      const cat = await this.prisma.category.findUnique({
        where: { slug: u.category },
        select: { id: true, children: { select: { id: true } } },
      });
      if (cat) where.categoryId = { in: [cat.id, ...cat.children.map((ch) => ch.id)] };
    }
    if (u.priceMin != null || u.priceMax != null) {
      const price: Prisma.DecimalNullableFilter = {};
      if (u.priceMin != null) price.gte = u.priceMin;
      if (u.priceMax != null) price.lte = u.priceMax;
      where.price = price;
    }
    if (u.keywords) {
      // əsas söz title-da axtarılır (brend/model)
      const firstWord = u.keywords.trim().split(/\s+/)[0];
      where.title = { contains: firstWord, mode: 'insensitive' };
    }

    const items = await this.prisma.listing.findMany({
      where,
      orderBy: [{ isVip: 'desc' }, { createdAt: 'desc' }],
      take: 24,
      include: { images: { orderBy: { sortOrder: 'asc' }, take: 1 } },
    });

    return {
      data: items.map(toListingResponse),
      understanding: u,
      meta: { total: items.length },
    };
  }

  // ---- AI elan yaratma: sərbəst mətn → struktur elan layihəsi ----
  async generateListing(text: string) {
    const cats = await this.prisma.category.findMany({
      where: { isActive: true },
      select: { slug: true, nameAz: true, vertical: true },
      orderBy: { sortOrder: 'asc' },
      take: 120,
    });
    const catList = cats.map((c) => `${c.slug}=${c.nameAz}`).join(', ');

    const system = `Sən 360tap.az üçün elan yaratma köməkçisisən. İstifadəçinin sərbəst mətnindən professional elan layihəsi qur.
YALNIZ JSON qaytar:
{
  "title": "qısa cəlbedici başlıq (max 100 simvol)",
  "description": "professional, səlis təsvir (2-4 cümlə, AZ dilində)",
  "category": "ən uyğun kateqoriya slug",
  "vertical": "transport | realestate | job | universal",
  "price": number | null,
  "currency": "AZN",
  "region": "region slug və ya null",
  "attributes": { "brend": "...", "model": "...", "rəng": "...", "yaddaş": "...", "vəziyyət": "Yeni/İşlənmiş", ... yalnız uyğun olanlar }
}
Mövcud kateqoriya slug-ları: ${catList}.
Qiyməti manatla götür. Region AZ adından slug-a çevir (qəbələ→qebele).`;

    const draft = await this.groqJSON(system, text);
    return { draft };
  }
}
