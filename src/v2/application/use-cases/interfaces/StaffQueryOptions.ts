export interface StaffQueryOptions {
  limit: number;
  page: number;
  sortBy: string;
  sortDir: 'asc' | 'desc';
  search?: string;
  role?: string;
  isOwner?: boolean;
  includeOwner?: boolean;
}