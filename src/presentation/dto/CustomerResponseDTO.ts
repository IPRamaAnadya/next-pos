import { Customer } from '../../domain/entities/Customer';
import { PaginatedCustomers } from '../../domain/repositories/CustomerRepository';
import { apiResponse } from '@/app/api/utils/response';

export class CustomerResponseDTO {
  static mapToResponse(customer: Customer) {
    return {
      id: customer.id,
      tenant_id: customer.tenantId,
      membership_code: customer.membershipCode,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      birthday: customer.birthday ? customer.birthday.toISOString().split('T')[0] : null,
      last_purchase_at: customer.lastPurchaseAt ? customer.lastPurchaseAt.toISOString() : null,
      membership_expired_at: customer.membershipExpiredAt ? customer.membershipExpiredAt.toISOString() : null,
      points: customer.points,
      is_active: customer.isActive(),
      is_member: customer.isMember(),
      created_at: customer.createdAt.toISOString(),
      updated_at: customer.updatedAt.toISOString(),
    };
  }

  static mapPaginatedResponse(paginatedCustomers: PaginatedCustomers) {
    return apiResponse.success({
      message: 'Customers retrieved successfully',
      data: paginatedCustomers.data ? paginatedCustomers.data.map(this.mapToResponse) : [],
      pagination: {
        page: paginatedCustomers.pagination.page,
        pageSize: paginatedCustomers.pagination.limit,
        total: paginatedCustomers.pagination.total,
      }
    });
  }

  static mapSingleResponse(customer: Customer) {
    return apiResponse.success({
      message: 'Customer retrieved successfully',
      data: customer ? this.mapToResponse(customer) : {}
    });
  }

  static mapCreatedResponse(customer: Customer) {
    return apiResponse.success({
      message: 'Customer created successfully',
      data: customer ? this.mapToResponse(customer) : {}
    });
  }

  static mapUpdatedResponse(customer: Customer) {
    return apiResponse.success({
      message: 'Customer updated successfully',
      data: customer ? this.mapToResponse(customer) : {}
    });
  }

  static mapDeletedResponse() {
    return apiResponse.success({
      message: 'Customer deleted successfully',
      data: {}
    });
  }
}