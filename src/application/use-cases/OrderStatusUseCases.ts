import { OrderStatus, OrderStatusQueryOptions, PaginatedOrderStatuses } from '../../domain/entities/OrderStatus';
import { OrderStatusRepository } from '../../domain/repositories/OrderStatusRepository';

export class GetOrderStatusesUseCase {
  constructor(private repository: OrderStatusRepository) {}

  async execute(tenantId: string, options: OrderStatusQueryOptions): Promise<PaginatedOrderStatuses> {
    return await this.repository.findAll(tenantId, options);
  }
}

export class GetOrderStatusByIdUseCase {
  constructor(private repository: OrderStatusRepository) {}

  async execute(id: string, tenantId: string): Promise<OrderStatus | null> {
    return await this.repository.findById(id, tenantId);
  }
}

export class GetOrderStatusByCodeUseCase {
  constructor(private repository: OrderStatusRepository) {}

  async execute(code: string, tenantId: string): Promise<OrderStatus | null> {
    return await this.repository.findByCode(code, tenantId);
  }
}

export class CreateOrderStatusUseCase {
  constructor(private repository: OrderStatusRepository) {}

  async execute(data: any, tenantId: string): Promise<OrderStatus> {
    // Create the new status
    const newStatus = await this.repository.create(data, tenantId);
    
    // Get all statuses to reorder
    const allStatuses = await this.repository.findAll(tenantId, { 
      limit: 1000, 
      sortBy: 'order', 
      sortDir: 'asc' 
    });
    
    // Reorder all statuses to ensure proper sequence
    const reorderData = allStatuses.data.map((status, index) => ({
      id: status.id,
      order: index + 1
    }));
    
    if (reorderData.length > 0) {
      await this.repository.reorderStatuses(tenantId, reorderData);
    }
    
    // Return the newly created status with updated order
    return await this.repository.findById(newStatus.id, tenantId) || newStatus;
  }
}

export class UpdateOrderStatusUseCase {
  constructor(private repository: OrderStatusRepository) {}

  async execute(id: string, data: any, tenantId: string): Promise<OrderStatus> {
    // Check if order field is being updated
    const isOrderChanged = data.order !== undefined;
    
    // Update the status
    const updatedStatus = await this.repository.update(id, data, tenantId);
    
    // If order changed, reorder all statuses
    if (isOrderChanged) {
      const allStatuses = await this.repository.findAll(tenantId, { 
        limit: 1000, 
        sortBy: 'order', 
        sortDir: 'asc' 
      });
      
      // Reorder all statuses to ensure proper sequence
      const reorderData = allStatuses.data.map((status, index) => ({
        id: status.id,
        order: index + 1
      }));
      
      if (reorderData.length > 0) {
        await this.repository.reorderStatuses(tenantId, reorderData);
      }
      
      // Return the updated status with new order
      return await this.repository.findById(updatedStatus.id, tenantId) || updatedStatus;
    }
    
    return updatedStatus;
  }
}

export class DeleteOrderStatusUseCase {
  constructor(private repository: OrderStatusRepository) {}

  async execute(id: string, tenantId: string): Promise<void> {
    // Delete the status
    await this.repository.delete(id, tenantId);
    
    // Get remaining statuses and reorder them
    const allStatuses = await this.repository.findAll(tenantId, { 
      limit: 1000, 
      sortBy: 'order', 
      sortDir: 'asc' 
    });
    
    // Reorder remaining statuses to fill gaps
    const reorderData = allStatuses.data.map((status, index) => ({
      id: status.id,
      order: index + 1
    }));
    
    if (reorderData.length > 0) {
      await this.repository.reorderStatuses(tenantId, reorderData);
    }
  }
}

export class GetDefaultOrderStatusesUseCase {
  constructor(private repository: OrderStatusRepository) {}

  async execute(tenantId: string): Promise<OrderStatus[]> {
    return await this.repository.getDefaultStatuses(tenantId);
  }
}

export class ReorderOrderStatusesUseCase {
  constructor(private repository: OrderStatusRepository) {}

  async execute(tenantId: string, orders: { id: string; order: number }[]): Promise<OrderStatus[]> {
    if (!orders || orders.length === 0) {
      throw new Error('At least one status order must be provided');
    }

    return await this.repository.reorderStatuses(tenantId, orders);
  }
}
