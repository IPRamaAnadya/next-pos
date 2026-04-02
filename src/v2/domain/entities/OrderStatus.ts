export interface OrderStatus {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  order: number;
  isFinal: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateOrderStatusData {
  code: string;
  name: string;
  order: number;
  isFinal?: boolean;
  isActive?: boolean;
}

export interface UpdateOrderStatusData extends CreateOrderStatusData {
  id: string;
}

export interface OrderStatusQueryOptions {
  limit?: number;
  page?: number;
  sortBy?: keyof OrderStatus;
  sortDir?: 'asc' | 'desc';
  filters?: {
    search?: string;
    isActive?: boolean;
  };
}

export interface PaginatedOrderStatuses {
  data: OrderStatus[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
