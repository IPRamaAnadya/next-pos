import { Tenant } from '../entities/Tenant';

export class TenantDomainService {
  static validateTenantData(tenant: Tenant): void {
    if (!tenant.isValid()) {
      throw new Error('Invalid tenant data');
    }

    // Additional business validation
    if (!tenant.isValidName()) {
      throw new Error('Tenant name cannot be empty');
    }

    if (!tenant.isValidEmail()) {
      throw new Error('Invalid email format');
    }
  }

  static validateTenantCreation(data: {
    userId: string;
    name: string;
    email: string;
    address?: string | null;
    phone?: string | null;
  }): void {
    if (!data.userId || data.userId.trim().length === 0) {
      throw new Error('User ID is required');
    }

    if (!data.name || data.name.trim().length === 0) {
      throw new Error('Tenant name is required');
    }

    if (!data.email || data.email.trim().length === 0) {
      throw new Error('Email is required');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      throw new Error('Invalid email format');
    }

    if (data.phone && data.phone !== null && data.phone.length > 0 && data.phone.length < 10) {
      throw new Error('Phone number must be at least 10 digits');
    }
  }

  static validateTenantUpdate(updates: Partial<{
    name: string;
    email: string;
    address: string | null;
    phone: string | null;
    subscribedUntil: Date | null;
    isSubscribed: boolean;
  }>): void {
    if (updates.name !== undefined && updates.name.trim().length === 0) {
      throw new Error('Tenant name cannot be empty');
    }

    if (updates.email !== undefined) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(updates.email)) {
        throw new Error('Invalid email format');
      }
    }

    if (updates.phone !== undefined && updates.phone !== null && updates.phone.length > 0 && updates.phone.length < 10) {
      throw new Error('Phone number must be at least 10 digits');
    }

    if (updates.subscribedUntil !== undefined && updates.subscribedUntil !== null && updates.subscribedUntil < new Date()) {
      throw new Error('Subscription end date cannot be in the past');
    }
  }

  static checkSubscriptionAccess(tenant: Tenant): void {
    if (!tenant.canAccess()) {
      const status = tenant.getSubscriptionStatus();
      switch (status) {
        case 'inactive':
          throw new Error('Tenant subscription is inactive');
        case 'expired':
          throw new Error('Tenant subscription has expired');
        default:
          throw new Error('Tenant does not have access');
      }
    }
  }

  static calculateTrialPeriod(startDate: Date, trialDays: number = 14): Date {
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + trialDays);
    return endDate;
  }

  static isEligibleForTrial(tenant: Tenant): boolean {
    // A tenant is eligible for trial if they haven't been subscribed before
    return tenant.subscribedUntil === null && tenant.isSubscribed === false;
  }

  static getTenantMetrics(tenant: Tenant) {
    return {
      id: tenant.id,
      name: tenant.name,
      isActive: tenant.isActive(),
      subscriptionStatus: tenant.getSubscriptionStatus(),
      daysUntilExpiry: tenant.getDaysUntilExpiry(),
      canAccess: tenant.canAccess(),
      isEligibleForTrial: this.isEligibleForTrial(tenant),
    };
  }
}