import { discountRepository } from './discount.repository';
import type {
  CreateDiscountInput,
  DiscountProfile,
  DiscountQueryInput,
  UpdateDiscountInput,
  ValidateDiscountInput,
  ValidateDiscountResult,
} from './discount.type';

// ─────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────

interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

function buildPagination(total: number, page: number, pageSize: number): PaginationMeta {
  return { page, pageSize, total, totalPages: Math.ceil(total / pageSize) };
}

const VALID_TYPES = ['percentage', 'fixed_amount'] as const;

// ─────────────────────────────────────────────
//  DiscountService
// ─────────────────────────────────────────────

class DiscountService {
  // ── Read ────────────────────────────────────

  async listDiscounts(
    tenantId: string,
    query: DiscountQueryInput,
  ): Promise<{ items: DiscountProfile[]; pagination: PaginationMeta }> {
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 20));

    const { items, total } = await discountRepository.findAll(tenantId, { ...query, page, pageSize });

    return {
      items: items.map((d) => d.toProfile()),
      pagination: buildPagination(total, page, pageSize),
    };
  }

  async getDiscount(id: string, tenantId: string): Promise<DiscountProfile> {
    const discount = await discountRepository.findById(id, tenantId);
    if (!discount) throw new Error('Discount not found');
    return discount.toProfile();
  }

  async getActiveDiscounts(tenantId: string): Promise<DiscountProfile[]> {
    const discounts = await discountRepository.findActive(tenantId);
    return discounts.map((d) => d.toProfile());
  }

  // ── Mutate ──────────────────────────────────

  async createDiscount(tenantId: string, input: CreateDiscountInput): Promise<DiscountProfile> {
    if (!input.name?.trim()) throw new Error('Discount name is required');
    if (!VALID_TYPES.includes(input.type)) throw new Error('Type must be percentage or fixed_amount');
    if (input.value <= 0) throw new Error('Discount value must be greater than 0');
    if (input.type === 'percentage' && input.value > 100) throw new Error('Percentage discount cannot exceed 100');
    if (input.validFrom && input.validTo && input.validFrom >= input.validTo) {
      throw new Error('validFrom must be before validTo');
    }

    if (input.code) {
      const duplicate = await discountRepository.findByCode(input.code, tenantId);
      if (duplicate) throw new Error('A discount with this code already exists');
    }

    const discount = await discountRepository.create(tenantId, input);
    return discount.toProfile();
  }

  async updateDiscount(id: string, tenantId: string, input: UpdateDiscountInput): Promise<DiscountProfile> {
    const existing = await discountRepository.findById(id, tenantId);
    if (!existing) throw new Error('Discount not found');

    if (input.name !== undefined && !input.name.trim()) throw new Error('Discount name cannot be empty');
    if (input.type !== undefined && !VALID_TYPES.includes(input.type)) {
      throw new Error('Type must be percentage or fixed_amount');
    }
    if (input.value !== undefined && input.value <= 0) throw new Error('Discount value must be greater than 0');

    const effectiveType = input.type ?? existing.type;
    const effectiveValue = input.value ?? existing.value.toNumber();
    if (effectiveType === 'percentage' && effectiveValue > 100) throw new Error('Percentage discount cannot exceed 100');

    const effectiveFrom = input.validFrom !== undefined ? input.validFrom : existing.validFrom;
    const effectiveTo = input.validTo !== undefined ? input.validTo : existing.validTo;
    if (effectiveFrom && effectiveTo && effectiveFrom >= effectiveTo) {
      throw new Error('validFrom must be before validTo');
    }

    if (input.code && input.code !== existing.code) {
      const duplicate = await discountRepository.findByCode(input.code, tenantId, id);
      if (duplicate) throw new Error('A discount with this code already exists');
    }

    const discount = await discountRepository.update(id, tenantId, input);
    return discount.toProfile();
  }

  async deleteDiscount(id: string, tenantId: string): Promise<void> {
    const existing = await discountRepository.findById(id, tenantId);
    if (!existing) throw new Error('Discount not found');
    await discountRepository.delete(id, tenantId);
  }

  // ── Validate ────────────────────────────────

  async validateDiscount(tenantId: string, input: ValidateDiscountInput): Promise<ValidateDiscountResult> {
    if (!input.discountId && !input.code) {
      return { isValid: false, reason: 'Provide either discountId or code' };
    }

    const discount = input.discountId
      ? await discountRepository.findById(input.discountId, tenantId)
      : await discountRepository.findByCode(input.code!, tenantId);

    if (!discount) return { isValid: false, reason: 'Discount not found' };

    if (!discount.isActive()) {
      return { isValid: false, reason: 'Discount is not currently active' };
    }

    if (discount.isMemberOnly && !input.isMemberCustomer) {
      return { isValid: false, reason: 'This discount is only available for members' };
    }

    if (!discount.canApplyToAmount(input.orderAmount)) {
      const min = discount.minPurchase?.toNumber() ?? 0;
      return { isValid: false, reason: `Minimum purchase of ${min} required` };
    }

    const discountAmount = discount.calculateDiscountAmount(input.orderAmount);

    return {
      isValid: true,
      discount: discount.toProfile(),
      discountAmount,
    };
  }
}

export const discountService = new DiscountService();
