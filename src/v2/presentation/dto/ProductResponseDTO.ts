import { Product } from '../../domain/entities/Product';
import { PaginatedProducts } from '../../domain/repositories/ProductRepository';

export interface ProductResponse {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  price: number;
  type: string;
  stock: number | null;
  sku: string | null;
  image_url: string | null;
  alias: string | null;
  product_category_id: string | null;
  is_countable: boolean;
  unit: string;
  created_at: string;
  updated_at: string;
  // Additional computed fields
  formatted_price: string;
  is_in_stock: boolean;
  is_service: boolean;
  is_good: boolean;
}

export interface ProductListResponse {
  id: string;
  name: string;
  price: number;
  type: string;
  stock: number | null;
  sku: string | null;
  image_url: string | null;
  product_category_id: string | null;
  is_countable: boolean;
  unit: string;
  created_at: string;
  formatted_price: string;
  is_in_stock: boolean;
}

export interface PaginationResponse {
  total_data: number;
  per_page: number;
  current_page: number;
  total_page: number;
  next_page: number | null;
  prev_page: number | null;
}

export class ProductResponseMapper {
  static toProductResponse(product: Product): ProductResponse {
    return {
      id: product.id,
      tenant_id: product.tenantId,
      name: product.name,
      description: product.description,
      price: product.price,
      type: product.type,
      stock: product.stock,
      sku: product.sku,
      image_url: product.imageUrl,
      alias: product.alias,
      product_category_id: product.productCategoryId,
      is_countable: product.isCountable,
      unit: product.unit,
      created_at: product.createdAt.toISOString(),
      updated_at: product.updatedAt.toISOString(),
      // Additional computed fields
      formatted_price: product.getFormattedPrice(),
      is_in_stock: product.isInStock(),
      is_service: product.isService(),
      is_good: product.isGood(),
    };
  }

  static toProductListResponse(product: Product): ProductListResponse {
    return {
      id: product.id,
      name: product.name,
      price: product.price,
      type: product.type,
      stock: product.stock,
      sku: product.sku,
      image_url: product.imageUrl,
      product_category_id: product.productCategoryId,
      is_countable: product.isCountable,
      unit: product.unit,
      created_at: product.createdAt.toISOString(),
      formatted_price: product.getFormattedPrice(),
      is_in_stock: product.isInStock(),
    };
  }

  static toPaginationResponse(pagination: PaginatedProducts['pagination']): PaginationResponse {
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