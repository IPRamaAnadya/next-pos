import { Discount } from '../entities/Discount';
import { DiscountQueryOptions } from '../../application/use-cases/interfaces/DiscountQueryOptions';

export interface PaginatedDiscounts {
  data: Discount[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface DiscountRepository {
  findById(id: string, tenantId: string): Promise<Discount | null>;
  findAll(tenantId: string, options: DiscountQueryOptions): Promise<PaginatedDiscounts>;
  findByCode(code: string, tenantId: string, excludeId?: string): Promise<Discount | null>;
  findActiveDiscounts(tenantId: string): Promise<Discount[]>;
  create(discountData: {
    tenantId: string;
    code: string | null;
    name: string;
    description: string | null;
    type: string;
    value: number;
    validFrom: Date | null;
    validTo: Date | null;
    minPurchase: number | null;
    maxDiscount: number | null;
    applicableItems: any | null;
    rewardType: string | null;
    isMemberOnly: boolean;
  }): Promise<Discount>;
  update(id: string, tenantId: string, updates: Partial<Discount>): Promise<Discount>;
  delete(id: string, tenantId: string): Promise<void>;
  countActiveDiscounts(tenantId: string): Promise<number>;
}