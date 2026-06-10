import { Controller, Get, Param } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { CategoriesService } from './categories.service';
import type { CategoryAttributeDto, CategoryNode } from './dto/category-tree.dto';

@Public()
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  @Get()
  getTree(): Promise<CategoryNode[]> {
    return this.categories.getTree();
  }

  @Get(':slug')
  getBySlug(@Param('slug') slug: string): Promise<CategoryNode> {
    return this.categories.findBySlug(slug);
  }

  @Get(':slug/attributes')
  getAttributes(@Param('slug') slug: string): Promise<CategoryAttributeDto[]> {
    return this.categories.getAttributes(slug);
  }
}
