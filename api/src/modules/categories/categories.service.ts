import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { CategoryAttributeDto, CategoryNode } from './dto/category-tree.dto';

/**
 * Prisma sətrini API DTO-suna çevirir. `categoryId` xaricə sızmır: klient üçün
 * atributun hansı alt kateqoriyadan gəldiyi əhəmiyyətsizdir.
 */
function toAttributeDto(a: {
  id: string;
  key: string;
  labelAz: string;
  labelRu: string | null;
  type: string;
  options: unknown;
  unit: string | null;
  isRequired: boolean;
  isFilterable: boolean;
  sortOrder: number;
}): CategoryAttributeDto {
  return {
    id: a.id,
    key: a.key,
    labelAz: a.labelAz,
    labelRu: a.labelRu,
    type: a.type as CategoryAttributeDto['type'],
    options: a.options as CategoryAttributeDto['options'],
    unit: a.unit,
    isRequired: a.isRequired,
    isFilterable: a.isFilterable,
    sortOrder: a.sortOrder,
  };
}

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Bütün aktiv kateqoriyaları ağac strukturunda qaytarır.
   * Tək sorğuda yığılır, sonra yaddaşda quraşdırılır (N+1 yox).
   */
  async getTree(): Promise<CategoryNode[]> {
    const flat = await this.prisma.category.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { nameAz: 'asc' }],
      select: {
        id: true,
        parentId: true,
        slug: true,
        nameAz: true,
        nameRu: true,
        nameEn: true,
        icon: true,
        sortOrder: true,
        listingsCount: true,
      },
    });

    const map = new Map<string, CategoryNode>();
    for (const c of flat) {
      map.set(c.id, { ...c, children: [] });
    }

    const tree: CategoryNode[] = [];
    for (const c of flat) {
      const node = map.get(c.id);
      if (!node) continue;
      if (c.parentId) {
        const parent = map.get(c.parentId);
        if (parent) parent.children.push(node);
        else tree.push(node);
      } else {
        tree.push(node);
      }
    }
    return tree;
  }

  async findBySlug(slug: string): Promise<CategoryNode> {
    const c = await this.prisma.category.findUnique({
      where: { slug },
      select: {
        id: true,
        parentId: true,
        slug: true,
        nameAz: true,
        nameRu: true,
        nameEn: true,
        icon: true,
        sortOrder: true,
        listingsCount: true,
      },
    });
    if (!c) throw new NotFoundException(`Kateqoriya tapılmadı: ${slug}`);
    return { ...c, children: [] };
  }

  /**
   * KATEQORİYA FİLTRLƏRİ — YARPAQDA ÖZ ATRİBUTLARI, VERTİKALDA UMUMİLƏŞDİRİLMİŞ.
   *
   * PROBLEM: atributlar yalnız yarpaq kateqoriyalara bağlanıb (avtomobiller → 14,
   * menziller → 9). Kök kateqoriyalarda («neqliyyat», «dasinmaz-emlak») HEÇ NƏ yox idi,
   * ona görə vertikal landinq səhifəsi yalnız ümumi zolağı (Region · Qiymət · Sıralama)
   * göstərirdi — yəni avtomobil, əmlak və vakansiya EYNİ generic formanı paylaşırdı.
   * Bu, Avito modelinin əsas prinsipini pozur: kateqoriyaya girən öz filtrlərini görməlidir.
   *
   * HƏLL: kateqoriyanın öz atributu yoxdursa, alt ağacdan «ümumi məxrəc» hesablanır —
   * atribut daşıyan törəmələrin ƏN AZI YARISINDA təkrarlanan açarlar.
   *
   * NİYƏ KƏSİŞMƏ YOX, ÇOXLUQ (≥50%): tam kəsişmə praktikada boş çıxır — «neqliyyat»
   * altında `ehtiyat-hisseleri` və `tekerler-diskler` `year` saxlamır, ona görə ciddi
   * kəsişmə ∅ verərdi. ≥50% astanası ölçülmüş nəticə verir:
   *   neqliyyat      → İl (6/8) · Növ (6/8) · Marka (4/8)
   *   dasinmaz-emlak → Əməliyyat növü (7/7) · Sahə (6/7) · Otaq (4/7) · Çıxarış (4/7)
   * Yəni üç vertikal artıq bir-birindən fərqli filtr dəsti göstərir.
   *
   * NİYƏ BİRLƏŞMƏ (union) OPSİYALARDA: eyni açar («type») alt kateqoriyalarda müxtəlif
   * dəyər siyahısı saxlayır. Vertikal səviyyədə istifadəçi hamısını görməlidir, əks halda
   * «Qoşqu» seçimi nəqliyyat səhifəsində itərdi.
   *
   * NİYƏ YALNIZ ÖZ ATRİBUTU OLMAYANDA: yarpaq davranışı TOXUNULMAZ qalır — bu düzəliş
   * işləyən heç bir səhifəni dəyişmir, sadəcə boş olanı doldurur.
   */
  async getAttributes(slug: string): Promise<CategoryAttributeDto[]> {
    const category = await this.prisma.category.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!category) throw new NotFoundException(`Kateqoriya tapılmadı: ${slug}`);

    const own = await this.findAttributes([category.id]);
    if (own.length) return own.map(toAttributeDto);

    const descendantIds = await this.collectDescendantIds(category.id);
    if (!descendantIds.length) return [];

    return this.rollUpAttributes(descendantIds);
  }

  private async findAttributes(categoryIds: string[]) {
    return this.prisma.categoryAttribute.findMany({
      where: { categoryId: { in: categoryIds } },
      orderBy: [{ sortOrder: 'asc' }, { labelAz: 'asc' }],
      select: {
        id: true,
        categoryId: true,
        key: true,
        labelAz: true,
        labelRu: true,
        type: true,
        options: true,
        unit: true,
        isRequired: true,
        isFilterable: true,
        sortOrder: true,
      },
    });
  }

  /** Verilmiş kateqoriyanın bütün alt ağacı (özü daxil deyil). */
  private async collectDescendantIds(rootId: string): Promise<string[]> {
    const all = await this.prisma.category.findMany({
      where: { isActive: true },
      select: { id: true, parentId: true },
    });
    const byParent = new Map<string, string[]>();
    for (const c of all) {
      if (!c.parentId) continue;
      const list = byParent.get(c.parentId);
      if (list) list.push(c.id);
      else byParent.set(c.parentId, [c.id]);
    }
    const out: string[] = [];
    const stack = [rootId];
    while (stack.length) {
      const id = stack.pop() as string;
      for (const child of byParent.get(id) ?? []) {
        out.push(child);
        stack.push(child);
      }
    }
    return out;
  }

  /** Alt ağacdakı atributlardan vertikal səviyyəli ümumi dəst qurur. */
  private async rollUpAttributes(descendantIds: string[]): Promise<CategoryAttributeDto[]> {
    const rows = await this.findAttributes(descendantIds);
    if (!rows.length) return [];

    // Astana yalnız ATRİBUT DAŞIYAN törəmələr üzərində hesablanır: boş kateqoriyalar
    // (məs. `elektronika/komputerler`) astananı süni şəkildə qaldırıb hər şeyi kəsərdi.
    const bearers = new Set(rows.map((r) => r.categoryId));
    const threshold = Math.ceil(bearers.size / 2);

    type Agg = {
      row: (typeof rows)[number];
      owners: Set<string>;
      options: string[];
      seen: Set<string>;
    };
    const byKey = new Map<string, Agg>();

    for (const r of rows) {
      let agg = byKey.get(r.key);
      if (!agg) {
        agg = { row: r, owners: new Set(), options: [], seen: new Set() };
        byKey.set(r.key, agg);
      }
      agg.owners.add(r.categoryId);
      // Opsiyalar birləşdirilir, sıra qorunur, təkrarlar atılır.
      if (Array.isArray(r.options)) {
        for (const o of r.options as unknown[]) {
          if (typeof o !== 'string' || agg.seen.has(o)) continue;
          agg.seen.add(o);
          agg.options.push(o);
        }
      }
    }

    return Array.from(byKey.values())
      .filter((a) => a.owners.size >= threshold)
      // Vertikal filtri MƏCBURİ ola bilməz — o, elan yaratmaq üçün deyil, axtarış üçündür.
      .map((a) => toAttributeDto({ ...a.row, options: a.options, isRequired: false }))
      .sort((a, b) => a.sortOrder - b.sortOrder || a.labelAz.localeCompare(b.labelAz, 'az'));
  }

  /**
   * Verilmiş kateqoriya ID-i mövcuddurmu və aktivdirmi?
   * Listings.create-də doğrulama üçün istifadə olunur.
   */
  async assertExists(categoryId: string): Promise<{ id: string; vertical: string }> {
    const c = await this.prisma.category.findFirst({
      where: { id: categoryId, isActive: true },
      select: { id: true, vertical: true },
    });
    if (!c) throw new NotFoundException('Kateqoriya tapılmadı və ya deaktivdir');
    return c;
  }
}
