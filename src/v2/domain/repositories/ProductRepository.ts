import { Product } from '../entities/Product';
import { ProductQueryOptions } from '../../application/use-cases/interfaces/ProductQueryOptions';

export interface ProductRepository {
  findById(id: string, tenantId: string): Promise<Product | null>;
  findAll(tenantId: string, options: ProductQueryOptions): Promise<PaginatedProducts>;
  create(productData: {
    tenantId: string;
    name: string;
    description: string | null;
    price: number;
    type: string;
    stock: number | null;
    sku: string | null;
    imageUrl: string | null;
    alias: string | null;
    productCategoryId: string | null;
  }): Promise<Product>;
  update(id: string, tenantId: string, updates: Partial<Product>): Promise<Product>;
  delete(id: string, tenantId: string): Promise<void>;
  findBySku(sku: string, tenantId: string): Promise<Product | null>;
  updateStock(id: string, tenantId: string, stockChange: number): Promise<Product>;
}

export interface PaginatedProducts {
  data: Product[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}