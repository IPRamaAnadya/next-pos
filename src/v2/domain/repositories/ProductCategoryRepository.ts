import { ProductCategory } from '../entities/ProductCategory';
import { ProductCategoryQueryOptions } from '../../application/use-cases/interfaces/ProductCategoryQueryOptions';

export interface PaginatedProductCategories {
  data: ProductCategory[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ProductCategoryRepository {
  findById(id: string, tenantId: string): Promise<ProductCategory | null>;
  findAll(tenantId: string, options: ProductCategoryQueryOptions): Promise<PaginatedProductCategories>;
  findByParentId(parentId: string | null, tenantId: string): Promise<ProductCategory[]>;
  findRootCategories(tenantId: string): Promise<ProductCategory[]>;
  create(categoryData: {
    tenantId: string;
    name: string;
    description: string | null;
    parentId: string | null;
  }): Promise<ProductCategory>;
  update(id: string, tenantId: string, updates: Partial<ProductCategory>): Promise<ProductCategory>;
  delete(id: string, tenantId: string): Promise<void>;
  countChildren(id: string, tenantId: string): Promise<number>;
  findByName(name: string, tenantId: string, excludeId?: string): Promise<ProductCategory | null>;
}