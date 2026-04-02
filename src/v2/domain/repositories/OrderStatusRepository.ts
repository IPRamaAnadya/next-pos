import {
  OrderStatus,
  CreateOrderStatusData,
  UpdateOrderStatusData,
  OrderStatusQueryOptions,
  PaginatedOrderStatuses,
} from '../entities/OrderStatus';

export interface OrderStatusRepository {
  findById(id: string, tenantId: string): Promise<OrderStatus | null>;
  findByCode(code: string, tenantId: string): Promise<OrderStatus | null>;
  findAll(tenantId: string, options: OrderStatusQueryOptions): Promise<PaginatedOrderStatuses>;
  create(data: CreateOrderStatusData, tenantId: string): Promise<OrderStatus>;
  update(id: string, data: UpdateOrderStatusData, tenantId: string): Promise<OrderStatus>;
  delete(id: string, tenantId: string): Promise<void>;
  getDefaultStatuses(tenantId: string): Promise<OrderStatus[]>;
  reorderStatuses(tenantId: string, orders: { id: string; order: number }[]): Promise<OrderStatus[]>;
}
