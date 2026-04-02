import { Order } from '../../domain/entities/Order';
import { OrderRepository } from '../../domain/repositories/OrderRepository';
import { OrderNotFoundError } from '../../domain/errors/OrderErrors';

export class GetOrderByIdUseCase {
  constructor(private orderRepository: OrderRepository) {}

  async execute(id: string, tenantId: string): Promise<Order> {
    const order = await this.orderRepository.findById(id, tenantId);
    
    if (!order) {
      throw new OrderNotFoundError(id);
    }

    return order;
  }
}