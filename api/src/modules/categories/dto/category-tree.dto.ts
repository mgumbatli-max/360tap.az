export interface CategoryNode {
  id: string;
  parentId: string | null;
  slug: string;
  nameAz: string;
  nameRu: string | null;
  nameEn: string | null;
  icon: string | null;
  sortOrder: number;
  listingsCount: number;
  children: CategoryNode[];
}

export interface CategoryAttributeDto {
  id: string;
  key: string;
  labelAz: string;
  labelRu: string | null;
  type: 'string' | 'number' | 'select' | 'multiselect' | 'boolean' | 'range';
  options: unknown;
  unit: string | null;
  isRequired: boolean;
  isFilterable: boolean;
  sortOrder: number;
}
