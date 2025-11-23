export interface CustomerQueryOptions {
  limit: number;
  page: number;
  sortBy: string;
  sortDir: 'asc' | 'desc';
  filters?: {
    search?: string; // Search across name and phone
    name?: string;
    email?: string;
    phone?: string;
    membershipCode?: string;
    hasActiveMembership?: boolean;
  };
}