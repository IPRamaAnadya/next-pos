export interface TenantQueryOptions {
  limit: number;
  page: number;
  sortBy: string;
  sortDir: 'asc' | 'desc';
  filters?: {
    name?: string;
    email?: string;
    userId?: string;
    isSubscribed?: boolean;
    subscriptionStatus?: 'active' | 'expired' | 'inactive';
    expiringSoon?: number; // days
  };
}

export interface CreateTenantRequest {
  userId: string;
  name: string;
  email: string;
  address?: string | null;
  phone?: string | null;
  subscribedUntil?: Date | null;
  isSubscribed?: boolean;
}

export interface UpdateTenantRequest {
  name?: string;
  email?: string;
  address?: string | null;
  phone?: string | null;
  subscribedUntil?: Date | null;
  isSubscribed?: boolean;
}

export interface TenantMetricsRequest {
  userId?: string;
  dateFrom?: Date;
  dateTo?: Date;
}