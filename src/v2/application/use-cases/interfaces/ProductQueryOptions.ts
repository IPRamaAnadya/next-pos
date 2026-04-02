export interface ProductQueryOptions {
  limit: number;
  page: number;
  sortBy: string;
  sortDir: 'asc' | 'desc';
  filters?: {
    name?: string;
    categoryId?: string;
    type?: 'good' | 'service';
    sku?: string;
    inStock?: boolean;
  };
}