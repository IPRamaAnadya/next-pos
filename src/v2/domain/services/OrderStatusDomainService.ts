import { OrderStatus, CreateOrderStatusData, UpdateOrderStatusData } from '../entities/OrderStatus';
import { OrderStatusRepository } from '../repositories/OrderStatusRepository';

export class OrderStatusDomainService {
  constructor(private repository: OrderStatusRepository) {}

  async validateCodeUnique(code: string, tenantId: string, excludeId?: string): Promise<boolean> {
    const existing = await this.repository.findByCode(code, tenantId);
    if (!existing) return true;
    return existing.id === excludeId; // Allow same ID (update case)
  }

  async validateNameUnique(name: string, tenantId: string, excludeId?: string): Promise<boolean> {
    const options = { limit: 1, filters: { search: name } };
    const result = await this.repository.findAll(tenantId, options);
    
    // Check for exact name match (case-insensitive)
    const existing = result.data.find(s => s.name.toLowerCase() === name.toLowerCase());
    if (!existing) return true;
    return existing.id === excludeId; // Allow same ID (update case)
  }

  async validateSingleFinalStatus(tenantId: string, excludeId?: string): Promise<boolean> {
    // Check if there's already a final status for this tenant
    const options = { limit: 100, filters: { } };
    const result = await this.repository.findAll(tenantId, options);
    
    const finalStatuses = result.data.filter(s => s.isFinal && s.id !== excludeId);
    
    // Only allow if no other final status exists
    return finalStatuses.length === 0;
  }

  async validateOrderSequence(tenantId: string): Promise<number> {
    const options = { limit: 1, sortBy: 'order' as const, sortDir: 'desc' as const };
    const result = await this.repository.findAll(tenantId, options);
    return result.data.length > 0 ? result.data[0].order + 1 : 1;
  }

  canDelete(status: OrderStatus): boolean {
    // Prevent deletion if it's marked as final or is the only active status
    return !status.isFinal;
  }

  canTransitionTo(status: OrderStatus): boolean {
    // Only transition to active statuses
    return status.isActive;
  }
}
