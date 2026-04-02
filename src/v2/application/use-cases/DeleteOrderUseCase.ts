import { 
  OrderRepository, 
  CustomerRepository 
} from '../../domain/repositories/OrderRepository';
import { OrderNotFoundError, OrderStatusError } from '../../domain/errors/OrderErrors';

export class DeleteOrderUseCase {
  constructor(
    private orderRepository: OrderRepository,
    private customerRepository: CustomerRepository
  ) {}

  async execute(id: string, tenantId: string): Promise<void> {
    // Get the order to delete
    const order = await this.orderRepository.findById(id, tenantId);
    if (!order) {
      throw new OrderNotFoundError(id);
    }

    // Check if order can be deleted
    if (order.orderStatus === 'completed') {
      throw new OrderStatusError('Order with completed status cannot be deleted');
    }

    // Reverse customer points if necessary
    if (order.paymentStatus === 'paid' && order.customerId) {
      await this.reverseCustomerPoints(order);
    }

    // Delete the order
    await this.orderRepository.delete(id, tenantId);
  }

  private async reverseCustomerPoints(order: any): Promise<void> {
    if (!order.customerId) return;

    // Reverse point deductions (add back points that were used)
    if (order.pointUsed && order.pointUsed > 0) {
      await this.customerRepository.incrementPoints(order.customerId, order.pointUsed);
    }

    // Reverse point rewards (deduct reward points that were given)
    if (order.discountRewardType === 'point' && order.discountAmount && order.discountAmount > 0) {
      await this.customerRepository.decrementPoints(order.customerId, order.discountAmount);
    }
  }
}