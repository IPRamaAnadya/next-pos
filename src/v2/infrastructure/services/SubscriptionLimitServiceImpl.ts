import { SubscriptionLimitService } from '../../domain/repositories/OrderRepository';

export class SubscriptionLimitServiceImpl implements SubscriptionLimitService {
  async enforceLimit(tenantId: string, limitType: 'transaction', increment: number): Promise<void> {
    try {
      // Dynamically import the subscription limit service
      const { enforceLimit } = await import('@/lib/subscriptionLimit');
      
      await enforceLimit(tenantId, limitType, increment);
    } catch (error: any) {
      throw new Error(error.message || 'Subscription limit exceeded');
    }
  }
}