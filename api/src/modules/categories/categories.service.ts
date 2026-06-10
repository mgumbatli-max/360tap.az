import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { CategoryAttributeDto, CategoryNode } from './dto/category-tree.dto';

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

  async getAttributes(slug: string): Promise<CategoryAttributeDto[]> {
    const category = await this.prisma.category.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!category) throw new NotFoundException(`Kateqoriya tapılmadı: ${slug}`);

    const attributes = await this.prisma.categoryAttribute.findMany({
      where: { categoryId: category.id },
      orderBy: [{ sortOrder: 'asc' }, { labelAz: 'asc' }],
      select: {
        id: true,
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

    return attributes.map((a) => ({
      ...a,
      type: a.type as CategoryAttributeDto['type'],
    }));
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
