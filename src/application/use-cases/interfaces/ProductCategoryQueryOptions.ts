export interface ProductCategoryQueryOptions {
  limit: number;
  page: number;
  sortBy: string;
  sortDir: 'asc' | 'desc';
  filters?: {
    name?: string;
    parentId?: string | null;
    rootOnly?: boolean;
  };
}