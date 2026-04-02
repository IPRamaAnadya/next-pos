import { Tenant } from '../../domain/entities/Tenant';
import { PaginatedTenants } from '../../domain/repositories/TenantRepository';
import { apiResponse } from '@/app/api/utils/response';

export class TenantResponseDTO {
  static mapToResponse(tenant: Tenant) {
    return {
      id: tenant.id,
      user_id: tenant.userId,
      name: tenant.name,
      email: tenant.email,
      address: tenant.address,
      phone: tenant.phone,
      subscribed_until: tenant.subscribedUntil ? tenant.subscribedUntil.toISOString() : null,
      is_subscribed: tenant.isSubscribed,
      created_at: tenant.createdAt.toISOString(),
      updated_at: tenant.updatedAt.toISOString(),
      // Computed properties from domain entity
      can_access: tenant.canAccess(),
      subscription_status: tenant.getSubscriptionStatus(),
      days_until_expiry: tenant.getDaysUntilExpiry(),
      display_name: tenant.getDisplayName(),
    };
  }

  static mapPaginatedResponse(paginatedTenants: PaginatedTenants) {
    return apiResponse.success({
      data: paginatedTenants.data.map(this.mapToResponse),
      message: 'Tenants retrieved successfully',
      pagination: {
        page: paginatedTenants.pagination.page,
        pageSize: paginatedTenants.pagination.limit,
        total: paginatedTenants.pagination.total,
      },
    });
  }

  static mapSingleResponse(tenant: Tenant) {
    return apiResponse.success({
      data: this.mapToResponse(tenant),
      message: 'Tenant retrieved successfully',
    });
  }

  static mapArrayResponse(tenants: Tenant[], message: string = 'Tenants retrieved successfully') {
    return apiResponse.success({
      data: tenants.map(this.mapToResponse),
      message: message,
    });
  }

  static mapCreatedResponse(tenant: Tenant) {
    return apiResponse.success({
      data: this.mapToResponse(tenant),
      message: 'Tenant created successfully',
    });
  }

  static mapUpdatedResponse(tenant: Tenant) {
    return apiResponse.success({
      data: this.mapToResponse(tenant),
      message: 'Tenant updated successfully',
    });
  }

  static mapDeletedResponse() {
    return apiResponse.success({
      data: {},
      message: 'Tenant deleted successfully',
    });
  }

  static mapMetricsResponse(metrics: any) {
    return apiResponse.success({
      data: {
        id: metrics.id,
        name: metrics.name,
        is_active: metrics.isActive,
        subscription_status: metrics.subscriptionStatus,
        days_until_expiry: metrics.daysUntilExpiry,
        can_access: metrics.canAccess,
        is_eligible_for_trial: metrics.isEligibleForTrial,
      },
      message: 'Tenant metrics retrieved successfully',
    });
  }

  static mapCountResponse(count: number, message: string = 'Count retrieved successfully') {
    return apiResponse.success({
      data: { count },
      message: message,
    });
  }

  static mapTrialExtendedResponse(tenant: Tenant) {
    return apiResponse.success({
      data: this.mapToResponse(tenant),
      message: 'Trial extended successfully',
    });
  }
}