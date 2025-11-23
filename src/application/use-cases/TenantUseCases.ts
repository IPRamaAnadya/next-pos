import { Tenant } from '../../domain/entities/Tenant';
import { TenantRepository, PaginatedTenants } from '../../domain/repositories/TenantRepository';
import { TenantDomainService } from '../../domain/services/TenantDomainService';
import { TenantQueryOptions, CreateTenantRequest, UpdateTenantRequest } from './interfaces/TenantQueryOptions';

export class TenantUseCases {
  private static instance: TenantUseCases;

  private constructor(private tenantRepository: TenantRepository) {}

  public static getInstance(tenantRepository: TenantRepository): TenantUseCases {
    if (!TenantUseCases.instance) {
      TenantUseCases.instance = new TenantUseCases(tenantRepository);
    }
    return TenantUseCases.instance;
  }

  async getTenants(options: TenantQueryOptions): Promise<PaginatedTenants> {
    try {
      return await this.tenantRepository.findAll(options);
    } catch (error) {
      console.error('Error getting tenants:', error);
      throw new Error('Failed to retrieve tenants');
    }
  }

  async getTenantById(id: string): Promise<Tenant> {
    if (!id || id.trim().length === 0) {
      throw new Error('Tenant ID is required');
    }

    const tenant = await this.tenantRepository.findById(id);
    if (!tenant) {
      throw new Error('Tenant not found');
    }
    return tenant;
  }

  async getTenantsByUserId(userId: string): Promise<Tenant[]> {
    if (!userId || userId.trim().length === 0) {
      throw new Error('User ID is required');
    }

    try {
      return await this.tenantRepository.findByUserId(userId);
    } catch (error) {
      console.error('Error getting tenants by user ID:', error);
      throw new Error('Failed to retrieve user tenants');
    }
  }

  async getTenantByEmail(email: string): Promise<Tenant | null> {
    if (!email || email.trim().length === 0) {
      throw new Error('Email is required');
    }

    try {
      return await this.tenantRepository.findByEmail(email);
    } catch (error) {
      console.error('Error getting tenant by email:', error);
      throw new Error('Failed to retrieve tenant by email');
    }
  }

  async createTenant(data: CreateTenantRequest): Promise<Tenant> {
    // Domain validation
    TenantDomainService.validateTenantCreation(data);

    // Check if email already exists
    const existingTenant = await this.tenantRepository.findByEmail(data.email);
    if (existingTenant) {
      throw new Error('A tenant with this email already exists');
    }

    try {
      const tenantData = {
        userId: data.userId,
        name: data.name.trim(),
        email: data.email.toLowerCase().trim(),
        address: data.address || null,
        phone: data.phone || null,
        subscribedUntil: data.subscribedUntil || null,
        isSubscribed: data.isSubscribed ?? false,
      };

      const tenant = await this.tenantRepository.create(tenantData);
      
      // Validate the created tenant
      TenantDomainService.validateTenantData(tenant);
      
      return tenant;
    } catch (error: any) {
      console.error('Error creating tenant:', error);
      if (error.message.includes('already exists') || error.message.includes('unique')) {
        throw new Error('A tenant with this email already exists');
      }
      throw new Error('Failed to create tenant');
    }
  }

  async updateTenant(id: string, updates: UpdateTenantRequest): Promise<Tenant> {
    if (!id || id.trim().length === 0) {
      throw new Error('Tenant ID is required');
    }

    // Validate updates
    TenantDomainService.validateTenantUpdate(updates);

    // Check if tenant exists
    const existingTenant = await this.getTenantById(id);

    // Check if email is being updated and doesn't conflict
    if (updates.email && updates.email !== existingTenant.email) {
      const tenantWithEmail = await this.tenantRepository.findByEmail(updates.email);
      if (tenantWithEmail && tenantWithEmail.id !== id) {
        throw new Error('A tenant with this email already exists');
      }
    }

    try {
      const cleanUpdates: any = {};
      
      if (updates.name !== undefined) cleanUpdates.name = updates.name.trim();
      if (updates.email !== undefined) cleanUpdates.email = updates.email.toLowerCase().trim();
      if (updates.address !== undefined) cleanUpdates.address = updates.address;
      if (updates.phone !== undefined) cleanUpdates.phone = updates.phone;
      if (updates.subscribedUntil !== undefined) cleanUpdates.subscribedUntil = updates.subscribedUntil;
      if (updates.isSubscribed !== undefined) cleanUpdates.isSubscribed = updates.isSubscribed;

      const updatedTenant = await this.tenantRepository.update(id, cleanUpdates);
      
      // Validate the updated tenant
      TenantDomainService.validateTenantData(updatedTenant);
      
      return updatedTenant;
    } catch (error: any) {
      console.error('Error updating tenant:', error);
      if (error.message.includes('already exists') || error.message.includes('unique')) {
        throw new Error('A tenant with this email already exists');
      }
      throw new Error('Failed to update tenant');
    }
  }

  async deleteTenant(id: string): Promise<void> {
    if (!id || id.trim().length === 0) {
      throw new Error('Tenant ID is required');
    }

    // Check if tenant exists
    await this.getTenantById(id);

    try {
      await this.tenantRepository.delete(id);
    } catch (error) {
      console.error('Error deleting tenant:', error);
      throw new Error('Failed to delete tenant');
    }
  }

  async getActiveTenantsByUserId(userId: string): Promise<Tenant[]> {
    if (!userId || userId.trim().length === 0) {
      throw new Error('User ID is required');
    }

    try {
      return await this.tenantRepository.findActiveByUserId(userId);
    } catch (error) {
      console.error('Error getting active tenants:', error);
      throw new Error('Failed to retrieve active tenants');
    }
  }

  async getExpiringSoonTenants(days: number = 7): Promise<Tenant[]> {
    if (days <= 0) {
      throw new Error('Days must be greater than 0');
    }

    try {
      return await this.tenantRepository.findExpiringSoon(days);
    } catch (error) {
      console.error('Error getting expiring tenants:', error);
      throw new Error('Failed to retrieve expiring tenants');
    }
  }

  async getTenantMetrics(tenantId: string) {
    const tenant = await this.getTenantById(tenantId);
    return TenantDomainService.getTenantMetrics(tenant);
  }

  async countUserTenants(userId: string): Promise<number> {
    if (!userId || userId.trim().length === 0) {
      throw new Error('User ID is required');
    }

    try {
      return await this.tenantRepository.countByUserId(userId);
    } catch (error) {
      console.error('Error counting user tenants:', error);
      throw new Error('Failed to count user tenants');
    }
  }

  async validateTenantAccess(tenantId: string): Promise<void> {
    const tenant = await this.getTenantById(tenantId);
    TenantDomainService.checkSubscriptionAccess(tenant);
  }

  async extendTrial(tenantId: string, days: number = 14): Promise<Tenant> {
    if (days <= 0) {
      throw new Error('Trial extension days must be greater than 0');
    }

    const tenant = await this.getTenantById(tenantId);
    
    if (!TenantDomainService.isEligibleForTrial(tenant)) {
      throw new Error('Tenant is not eligible for trial extension');
    }

    const trialEndDate = TenantDomainService.calculateTrialPeriod(new Date(), days);

    return await this.updateTenant(tenantId, {
      subscribedUntil: trialEndDate,
      isSubscribed: true,
    });
  }
}