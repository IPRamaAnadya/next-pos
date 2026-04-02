import { ProductCategory } from '../../domain/entities/ProductCategory';
import { PaginatedProductCategories } from '../../domain/repositories/ProductCategoryRepository';
import { ProductCategoryHierarchy } from '../../application/use-cases/ProductCategoryUseCases';

export interface ProductCategoryResponse {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
  // Additional computed fields
  display_name: string;
  is_root_category: boolean;
  has_parent: boolean;
  level: number;
}

export interface ProductCategoryListResponse {
  id: string;
  name: string;
  description: string | null;
  parent_id: string | null;
  created_at: string;
  display_name: string;
  is_root_category: boolean;
  level: number;
}

export interface ProductCategoryHierarchyResponse {
  category: ProductCategoryResponse;
  children: ProductCategoryHierarchyResponse[];
  level: number;
  path: string;
}

export interface PaginationResponse {
  total_data: number;
  per_page: number;
  current_page: number;
  total_page: number;
  next_page: number | null;
  prev_page: number | null;
}

export class ProductCategoryResponseMapper {
  static toCategoryResponse(category: ProductCategory): ProductCategoryResponse {
    return {
      id: category.id,
      tenant_id: category.tenantId,
      name: category.name,
      description: category.description,
      parent_id: category.parentId,
      created_at: category.createdAt.toISOString(),
      updated_at: category.updatedAt.toISOString(),
      // Additional computed fields
      display_name: category.getDisplayName(),
      is_root_category: category.isRootCategory(),
      has_parent: category.hasParent(),
      level: category.getLevel(),
    };
  }

  static toCategoryListResponse(category: ProductCategory): ProductCategoryListResponse {
    return {
      id: category.id,
      name: category.name,
      description: category.description,
      parent_id: category.parentId,
      created_at: category.createdAt.toISOString(),
      display_name: category.getDisplayName(),
      is_root_category: category.isRootCategory(),
      level: category.getLevel(),
    };
  }

  static toHierarchyResponse(hierarchy: ProductCategoryHierarchy): ProductCategoryHierarchyResponse {
    return {
      category: this.toCategoryResponse(hierarchy.category),
      children: hierarchy.children.map(child => this.toHierarchyResponse(child)),
      level: hierarchy.level,
      path: hierarchy.path,
    };
  }

  static toPaginationResponse(pagination: PaginatedProductCategories['pagination']): PaginationResponse {
    return {
      total_data: pagination.total,
      per_page: pagination.limit,
      current_page: pagination.page,
      total_page: pagination.totalPages,
      next_page: pagination.page < pagination.totalPages ? pagination.page + 1 : null,
      prev_page: pagination.page > 1 ? pagination.page - 1 : null,
    };
  }
}