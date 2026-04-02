import { Discount } from '../../domain/entities/Discount';
import { PaginatedDiscounts } from '../../domain/repositories/DiscountRepository';
import { apiResponse } from '@/app/api/utils/response';

export class DiscountResponseDTO {
  static mapToResponse(discount: Discount) {
    return {
      id: discount.id,
      tenant_id: discount.tenantId,
      code: discount.code,
      name: discount.name,
      description: discount.description,
      type: discount.type,
      value: discount.value,
      valid_from: discount.validFrom ? discount.validFrom.toISOString() : null,
      valid_to: discount.validTo ? discount.validTo.toISOString() : null,
      min_purchase: discount.minPurchase,
      max_discount: discount.maxDiscount,
      applicable_items: discount.applicableItems,
      reward_type: discount.rewardType,
      is_member_only: discount.isMemberOnly,
      is_active: discount.isActive(),
      display_value: discount.getDisplayValue(),
      created_at: discount.createdAt.toISOString(),
      updated_at: discount.updatedAt.toISOString(),
    };
  }

  static mapPaginatedResponse(paginatedDiscounts: PaginatedDiscounts) {
    return apiResponse.success({
      message: 'Discounts retrieved successfully',
      data: paginatedDiscounts.data ? paginatedDiscounts.data.map(this.mapToResponse) : [],
      pagination: {
        page: paginatedDiscounts.pagination.page,
        pageSize: paginatedDiscounts.pagination.limit,
        total: paginatedDiscounts.pagination.total,
      }
    });
  }

  static mapSingleResponse(discount: Discount) {
    return apiResponse.success({
      message: 'Discount retrieved successfully',
      data: discount ? this.mapToResponse(discount) : {}
    });
  }

  static mapCreatedResponse(discount: Discount) {
    return apiResponse.success({
      message: 'Discount created successfully',
      data: discount ? this.mapToResponse(discount) : {}
    });
  }

  static mapUpdatedResponse(discount: Discount) {
    return apiResponse.success({
      message: 'Discount updated successfully',
      data: discount ? this.mapToResponse(discount) : {}
    });
  }

  static mapDeletedResponse() {
    return apiResponse.success({
      message: 'Discount deleted successfully',
      data: {}
    });
  }

  static mapActiveDiscountsResponse(discounts: Discount[]) {
    return apiResponse.success({
      message: 'Active discounts retrieved successfully',
      data: discounts ? discounts.map(this.mapToResponse) : []
    });
  }

  static mapValidationResponse(result: { isValid: boolean; discount?: Discount; discountAmount?: number; reason?: string }) {
    if (result.isValid && result.discount) {
      return apiResponse.success({
        message: 'Discount is valid',
        data: {
          is_valid: true,
          discount: this.mapToResponse(result.discount),
          discount_amount: result.discountAmount,
        }
      });
    } else {
      return apiResponse.validationError([{
        field: 'discount',
        message: result.reason || 'Discount is not valid'
      }]);
    }
  }
}