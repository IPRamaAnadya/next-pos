// ─────────────────────────────────────────────
//  Category types
// ─────────────────────────────────────────────

export interface CategorySummary {
  id: string;
  name: string;
  description: string | null;
  parentId: string | null;
}

export interface CategoryProfile {
  id: string;
  name: string;
  description: string | null;
  parentId: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  childrenCount: number;
}

export interface CreateCategoryInput {
  name: string;
  description?: string;
  parentId?: string;
}

export interface UpdateCategoryInput {
  name?: string;
  description?: string;
  parentId?: string | null;
}

export interface CategoryQueryInput {
  page?: number;
  pageSize?: number;
  search?: string;
  parentId?: string | null;
}

// ─────────────────────────────────────────────
//  Product types
// ─────────────────────────────────────────────

export interface ProductProfile {
  id: string;
  tenantId: string | null;
  name: string;
  description: string | null;
  price: number;
  type: string;
  stock: number | null;
  sku: string | null;
  imageUrl: string | null;
  alias: string | null;
  isCountable: boolean;
  unit: string;
  productCategoryId: string | null;
  category: CategorySummary | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface CreateProductInput {
  name: string;
  description?: string;
  price: number;
  type: 'good' | 'service';
  stock?: number;
  sku?: string;
  imageUrl?: string;
  alias?: string;
  productCategoryId?: string;
  isCountable?: boolean;
  unit?: string;
}

export interface UpdateProductInput {
  name?: string;
  description?: string;
  price?: number;
  type?: 'good' | 'service';
  stock?: number;
  sku?: string;
  imageUrl?: string;
  alias?: string;
  productCategoryId?: string | null;
  isCountable?: boolean;
  unit?: string;
}

export interface UpdateStockInput {
  stock: number;
}

export interface ProductQueryInput {
  page?: number;
  pageSize?: number;
  search?: string;
  categoryId?: string;
  type?: string;
  sortBy?: 'name' | 'price' | 'stock' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}
