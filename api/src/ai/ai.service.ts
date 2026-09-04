import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Prisma } from '@prisma/client';
import type { AppConfig } from '../config/configuration';
import { PrismaService } from '../prisma/prisma.service';
import { toListingResponse } from '../modules/listings/dto/listing-response.dto';
import { ListingsService } from '../modules/listings/listings.service';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

const SEARCH_SYSTEM = `Sən 360tap.az marketplace üçün axtarış köməkçisisən. İstifadəçinin təbii dil sorğusundan struktur filter çıxar.
YALNIZ JSON obyekt qaytar (başqa mətn yox):
{
  "keywords": "YALNIZ konkret məhsul adı/modeli (məs. iPhone 14 Pro, Mercedes E220). Generic söz (telefon, maşın, ev, mənzil) keywords-ə YOX — onu category/vertical-ə qoy. Konkret ad yoxdursa null",
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

const VISION_SYSTEM = `Sən şəkildən məhsul tanıyan köməkçisən. Şəkildəki ƏSAS məhsulu müəyyən et və 360tap.az marketplace axtarışı üçün filter çıxar.
YALNIZ JSON qaytar:
{
  "keywords": "məhsulun konkret adı/modeli (məs. iPhone, Mercedes, divan) — şəkildən görünən",
  "vertical": "transport | realestate | universal | null",
  "category": "kateqoriya slug və ya null (telefonlar, avtomobiller, menziller, mebel, ...)",
  "brand": "brend və ya null",
  "color": "rəng və ya null"
}
Yalnız əmin olduğunu yaz, qalanı null.`;

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
  private readonly visionModel: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly listings: ListingsService,
    config: ConfigService<AppConfig, true>,
  ) {
    const g = config.get('groq', { infer: true });
    this.apiKey = g.apiKey;
    this.model = g.model;
    this.visionModel = g.visionModel;
  }

  get enabled(): boolean {
    return !!this.apiKey;
  }

  private extractJSON(content: string): Record<string, unknown> {
    try {
      return JSON.parse(content) as Record<string, unknown>;
    } catch {
      const m = content.match(/\{[\s\S]*\}/);
      if (m) {
        try {
          return JSON.parse(m[0]) as Record<string, unknown>;
        } catch {
          /* ignore */
        }
      }
      return {};
    }
  }

  /**
   * NİYƏ: əvvəl HƏR upstream nasazlığı (401 yanlış açar, 404 mövcud olmayan model id,
   * 5xx, şəbəkə) istifadəçiyə 400 "Bad Request" kimi qayıdırdı — yəni "istifadəçi səhv etdi".
   * Ona görə monitorinqdə və frontend-də xidmət deqradasiyası kimi görünmürdü və AI-nın
   * canlıda tamamilə ölü olması aylarla fərq edilmədi. İndi statusu təqsirkar tərəf təyin edir.
   */
  private failUpstream(scope: string, model: string, status: number, body: string): never {
    // 413 yeganə haldır ki, səbəb istifadəçinin göndərdiyi yükün özüdür — o, 4xx qalır.
    if (status === 413) {
      this.logger.warn(`Groq ${scope} 413 (model=${model}): yük çox böyükdür — ${body.slice(0, 300)}`);
      throw new BadRequestException('Göndərilən şəkil/mətn AI üçün çox böyükdür');
    }
    // Model id / açar / kvota upstream statusu ilə birlikdə loglanır ki, səbəb dərhal görünsün.
    this.logger.error(`Groq ${scope} upstream ${status} (model=${model}): ${body.slice(0, 500)}`);
    if (status >= 500) throw new BadGatewayException('AI xidməti cavab vermir (upstream xətası)');
    throw new ServiceUnavailableException('AI xidməti müvəqqəti əlçatmazdır');
  }

  private failConnection(scope: string, model: string, err: unknown): never {
    this.logger.error(
      `Groq ${scope} şəbəkə xətası (model=${model}): ${err instanceof Error ? err.message : String(err)}`,
    );
    throw new ServiceUnavailableException('AI xidmətinə qoşulmaq alınmadı');
  }

  // Konfiqurasiya boşluğu istifadəçinin təqsiri deyil → 503 (başlanğıc loqu artıq xəbərdarlıq edir).
  private assertEnabled(): void {
    if (!this.enabled) {
      this.logger.warn('GROQ_API_KEY yoxdur — AI sorğusu icra olunmadı');
      throw new ServiceUnavailableException('AI xidməti konfiqurasiya olunmayıb (GROQ_API_KEY)');
    }
  }

  private async groqJSON(system: string, user: string): Promise<Record<string, unknown>> {
    this.assertEnabled();
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
      this.failConnection('chat', this.model, e);
    }
    if (!res.ok) {
      this.failUpstream('chat', this.model, res.status, await res.text().catch(() => ''));
    }
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    return this.extractJSON(data.choices?.[0]?.message?.content ?? '{}');
  }

  private async groqVisionJSON(instruction: string, imageUrl: string): Promise<Record<string, unknown>> {
    this.assertEnabled();
    let res: Response;
    try {
      res = await fetch(GROQ_URL, {
        method: 'POST',
        headers: { Authorization: `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.visionModel,
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: instruction },
                { type: 'image_url', image_url: { url: imageUrl } },
              ],
            },
          ],
          temperature: 0.2,
          max_tokens: 500,
        }),
      });
    } catch (e) {
      this.failConnection('vision', this.visionModel, e);
    }
    if (!res.ok) {
      this.failUpstream('vision', this.visionModel, res.status, await res.text().catch(() => ''));
    }
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    return this.extractJSON(data.choices?.[0]?.message?.content ?? '{}');
  }

  // ---- Anlaşılmış filterlərə görə elan axtarışı (mətn və şəkil üçün ortaq) ----
  private async runSearch(u: SearchUnderstanding) {
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
      const words = u.keywords
        .trim()
        .split(/\s+/)
        .filter((w) => w.length >= 3);
      if (words.length) {
        where.OR = words.flatMap((w) => [
          { title: { contains: w, mode: 'insensitive' as const } },
          { description: { contains: w, mode: 'insensitive' as const } },
          { category: { nameAz: { contains: w, mode: 'insensitive' as const } } },
        ]);
      }
    }

    const items = await this.prisma.listing.findMany({
      where,
      orderBy: [{ isVip: 'desc' }, { createdAt: 'desc' }],
      take: 24,
      include: { images: { orderBy: { sortOrder: 'asc' }, take: 1 } },
    });

    return {
      data: items.map(toListingResponse),
      meta: { total: items.length, understanding: u },
    };
  }

  // ---- AI axtarış: təbii dil ----
  async aiSearch(query: string) {
    const u = (await this.groqJSON(SEARCH_SYSTEM, query)) as SearchUnderstanding;
    return this.runSearch(u);
  }

  // ---- AI şəkillə axtarış: vision → understanding → axtarış ----
  async imageSearch(imageUrl: string) {
    const u = (await this.groqVisionJSON(VISION_SYSTEM, imageUrl)) as SearchUnderstanding;
    return this.runSearch(u);
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
  "attributes": { "brand": "...", "model": "...", "color": "...", "memory": "...", "condition": "Yeni/İşlənmiş", "year": number, "mileage": number, "fuel": "...", "rooms": number, "area": number — açar adları İNGİLİSCƏ, yalnız uyğun olanları }
}
Atribut açarları MÜTLƏQ ingiliscə olsun (brand, model, color, memory, condition, year, mileage, fuel, transmission, rooms, area, floor). Mövcud kateqoriya slug-ları: ${catList}.
Qiyməti manatla götür. Region AZ adından slug-a çevir (qəbələ→qebele).`;

    const draft = await this.groqJSON(system, text);
    return { draft };
  }

  // ---- AI elanı real yarat: draft slug-larını id-yə həll edib DB-yə yaz ----
  async createListing(
    userId: string,
    d: {
      title: string;
      description: string;
      category: string;
      region?: string | null;
      price?: number | null;
      attributes?: Record<string, unknown>;
    },
  ) {
    const cat = await this.prisma.category.findUnique({
      where: { slug: d.category },
      select: { id: true },
    });
    if (!cat) throw new BadRequestException(`Kateqoriya tapılmadı: ${d.category}`);

    let districtId: string | undefined;
    if (d.region) {
      const region = await this.prisma.region.findUnique({
        where: { slug: d.region },
        select: { districts: { select: { id: true }, take: 1 } },
      });
      districtId = region?.districts[0]?.id;
    }

    return this.listings.create(userId, {
      title: d.title,
      description: d.description,
      categoryId: cat.id,
      districtId,
      price: typeof d.price === 'number' ? d.price : undefined,
      attributes: d.attributes,
    });
  }
}
