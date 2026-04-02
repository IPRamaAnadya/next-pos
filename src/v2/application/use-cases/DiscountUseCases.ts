import { Discount } from '../../domain/entities/Discount';
import { DiscountRepository } from '../../domain/repositories/DiscountRepository';
import { DiscountQueryOptions } from './interfaces/DiscountQueryOptions';

export class DiscountUseCases {
  private static instance: DiscountUseCases;

  private constructor(private discountRepository: DiscountRepository) {}

  public static getInstance(discountRepository: DiscountRepository): DiscountUseCases {
    if (!DiscountUseCases.instance) {
      DiscountUseCases.instance = new DiscountUseCases(discountRepository);
    }
    return DiscountUseCases.instance;
  }

  async getDiscounts(tenantId: string, options: DiscountQueryOptions) {
    return await this.discountRepository.findAll(tenantId, options);
  }

  async getDiscountById(id: string, tenantId: string) {
    const discount = await this.discountRepository.findById(id, tenantId);
    if (!discount) {
      throw new Error('Discount not found');
    }
    return discount;
  }

  async getActiveDiscounts(tenantId: string) {
    return await this.discountRepository.findActiveDiscounts(tenantId);
  }

  async createDiscount(data: {
    tenantId: string;
    code?: string;
    name: string;
    description?: string;
    type: string;
    value: number;
    validFrom?: Date;
    validTo?: Date;
    minPurchase?: number;
    maxDiscount?: number;
    applicableItems?: any;
    rewardType?: string;
    isMemberOnly?: boolean;
  }) {
    // Business validation
    if (!data.name || data.name.trim().length === 0) {
      throw new Error('Discount name is required');
    }

    if (!data.type || data.type.trim().length === 0) {
      throw new Error('Discount type is required');
    }

    if (!data.value || data.value <= 0) {
      throw new Error('Discount value must be greater than 0');
    }

    // Validate discount type
    const validTypes = ['percentage', 'fixed_amount', 'fixed'];
    if (!validTypes.includes(data.type.toLowerCase())) {
      throw new Error('Invalid discount type. Must be one of: percentage, fixed_amount, fixed');
    }

    // Validate percentage value
    if (data.type.toLowerCase() === 'percentage' && data.value > 100) {
      throw new Error('Percentage discount cannot be greater than 100%');
    }

    // Validate date range
    if (data.validFrom && data.validTo && data.validFrom >= data.validTo) {
      throw new Error('Valid from date must be before valid to date');
    }

    // Check for duplicate code if provided
    if (data.code) {
      const existingByCode = await this.discountRepository.findByCode(data.code, data.tenantId);
      if (existingByCode) {
        throw new Error('Discount with this code already exists');
      }
    }

    const discountData = {
      tenantId: data.tenantId,
      code: data.code || null,
      name: data.name.trim(),
      description: data.description || null,
      type: data.type.toLowerCase(),
      value: data.value,
      validFrom: data.validFrom || null,
      validTo: data.validTo || null,
      minPurchase: data.minPurchase || null,
      maxDiscount: data.maxDiscount || null,
      applicableItems: data.applicableItems || null,
      rewardType: data.rewardType || null,
      isMemberOnly: data.isMemberOnly ?? false,
    };

    return await this.discountRepository.create(discountData);
  }

  async updateDiscount(id: string, tenantId: string, updates: Partial<Discount>) {
    const existingDiscount = await this.getDiscountById(id, tenantId);

    // Validate name if being updated
    if (updates.name !== undefined && (!updates.name || updates.name.trim().length === 0)) {
      throw new Error('Discount name cannot be empty');
    }

    // Validate type if being updated
    if (updates.type !== undefined) {
      const validTypes = ['percentage', 'fixed_amount', 'fixed'];
      if (!validTypes.includes(updates.type.toLowerCase())) {
        throw new Error('Invalid discount type. Must be one of: percentage, fixed_amount, fixed');
      }
    }

    // Validate value if being updated
    if (updates.value !== undefined && updates.value <= 0) {
      throw new Error('Discount value must be greater than 0');
    }

    // Validate percentage value
    if (updates.type?.toLowerCase() === 'percentage' && updates.value && updates.value > 100) {
      throw new Error('Percentage discount cannot be greater than 100%');
    }

    // Check for duplicate code if being updated
    if (updates.code && updates.code !== existingDiscount.code) {
      const existingByCode = await this.discountRepository.findByCode(updates.code, tenantId, id);
      if (existingByCode) {
        throw new Error('Discount with this code already exists');
      }
    }

    // Validate date range if being updated
    const validFrom = updates.validFrom !== undefined ? updates.validFrom : existingDiscount.validFrom;
    const validTo = updates.validTo !== undefined ? updates.validTo : existingDiscount.validTo;
    
    if (validFrom && validTo && validFrom >= validTo) {
      throw new Error('Valid from date must be before valid to date');
    }

    // Trim name if provided
    if (updates.name) {
      updates = { ...updates, name: updates.name.trim() };
    }

    // Normalize type if provided
    if (updates.type) {
      updates = { ...updates, type: updates.type.toLowerCase() };
    }

    return await this.discountRepository.update(id, tenantId, updates);
  }

  async deleteDiscount(id: string, tenantId: string) {
    await this.getDiscountById(id, tenantId); // Ensure exists
    await this.discountRepository.delete(id, tenantId);
  }

  async getActiveDiscountsCount(tenantId: string): Promise<number> {
    return await this.discountRepository.countActiveDiscounts(tenantId);
  }

  async validateDiscountForOrder(discountId: string, tenantId: string, orderAmount: number, isMemberCustomer: boolean = false): Promise<{ isValid: boolean; discount?: Discount; discountAmount?: number; reason?: string }> {
    try {
      const discount = await this.getDiscountById(discountId, tenantId);

      // Check if discount is active
      if (!discount.isActive()) {
        return { isValid: false, reason: 'Discount is not currently active' };
      }

      // Check member-only restriction
      if (discount.isMemberOnly && !isMemberCustomer) {
        return { isValid: false, reason: 'This discount is only available for members' };
      }

      // Check minimum purchase requirement
      if (!discount.canApplyToAmount(orderAmount)) {
        return { 
          isValid: false, 
          reason: `Minimum purchase of $${discount.minPurchase} required` 
        };
      }

      const discountAmount = discount.calculateDiscountAmount(orderAmount);

      return {
        isValid: true,
        discount,
        discountAmount
      };
    } catch (error) {
      return { isValid: false, reason: 'Discount not found' };
    }
  }

  async findDiscountByCode(code: string, tenantId: string): Promise<Discount | null> {
    return await this.discountRepository.findByCode(code, tenantId);
  }
}