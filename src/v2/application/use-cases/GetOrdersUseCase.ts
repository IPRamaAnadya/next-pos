import { Order, OrderQueryOptions, PaginatedOrders } from '../../domain/entities/Order';
import { OrderRepository } from '../../domain/repositories/OrderRepository';

export class GetOrdersUseCase {
  constructor(private orderRepository: OrderRepository) {}

  async execute(tenantId: string, options: OrderQueryOptions): Promise<PaginatedOrders> {
    return await this.orderRepository.findAll(tenantId, options);
  }
}