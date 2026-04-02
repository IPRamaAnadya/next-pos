import { Order, CreateOrderData, UpdateOrderData, OrderQueryOptions, PaginatedOrders } from '../entities/Order';
import { CustomerRepository } from './CustomerRepository';

export interface OrderRepository {
  findById(id: string, tenantId: string): Promise<Order | null>;
  findAll(tenantId: string, options: OrderQueryOptions): Promise<PaginatedOrders>;
  create(data: CreateOrderData, tenantId: string): Promise<Order>;
  update(id: string, data: UpdateOrderData, tenantId: string): Promise<Order>;
  delete(id: string, tenantId: string): Promise<void>;
  generateOrderNumber(): string;
}

// Re-export CustomerRepository for backward compatibility
export type { CustomerRepository };

export interface NotificationService {
  sendOrderNotification(params: {
    tenantId: string;
    event: 'ORDER_CREATED' | 'ORDER_PAID';
    orderId: string;
    variables: {
      phone: string;
      customerName: string;
      grandTotal: string;
    };
  }): Promise<void>;
}

export interface SubscriptionLimitService {
  enforceLimit(tenantId: string, limitType: 'transaction', increment: number): Promise<void>;
}