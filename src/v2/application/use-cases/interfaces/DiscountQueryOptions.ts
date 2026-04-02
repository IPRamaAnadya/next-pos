export interface DiscountQueryOptions {
  limit: number;
  page: number;
  sortBy: string;
  sortDir: 'asc' | 'desc';
  filters?: {
    name?: string;
    code?: string;
    type?: string;
    isActive?: boolean;
    isMemberOnly?: boolean;
    rewardType?: string;
  };
}