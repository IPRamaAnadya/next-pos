export interface ExpenseCategoryQueryOptions {
  limit: number;
  page: number;
  sortBy: string;
  sortDir: 'asc' | 'desc';
  search?: string;
  code?: string;
  isPrivate?: boolean;
  isCashier?: boolean;
}