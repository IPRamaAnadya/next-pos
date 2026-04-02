// ─────────────────────────────────────────────
//  Discount types
// ─────────────────────────────────────────────

export type DiscountType = 'percentage' | 'fixed_amount';

export interface DiscountProfile {
  id: string;
  tenantId: string | null;
  code: string | null;
  name: string;
  description: string | null;
  type: DiscountType;
  value: number;
  validFrom: Date | null;
  validTo: Date | null;
  minPurchase: number | null;
  maxDiscount: number | null;
  applicableItems: unknown;
  rewardType: string | null;
  isMemberOnly: boolean;
  isActive: boolean;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface CreateDiscountInput {
  code?: string | null;
  name: string;
  description?: string;
  type: DiscountType;
  value: number;
  validFrom?: Date | null;
  validTo?: Date | null;
  minPurchase?: number | null;
  maxDiscount?: number | null;
  applicableItems?: unknown;
  rewardType?: string | null;
  isMemberOnly?: boolean;
}

export interface UpdateDiscountInput {
  code?: string | null;
  name?: string;
  description?: string | null;
  type?: DiscountType;
  value?: number;
  validFrom?: Date | null;
  validTo?: Date | null;
  minPurchase?: number | null;
  maxDiscount?: number | null;
  applicableItems?: unknown;
  rewardType?: string | null;
  isMemberOnly?: boolean;
}

export interface DiscountQueryInput {
  page?: number;
  pageSize?: number;
  search?: string;
  type?: DiscountType;
  isActive?: boolean;
  isMemberOnly?: boolean;
}

export interface ValidateDiscountInput {
  discountId?: string;
  code?: string;
  orderAmount: number;
  isMemberCustomer?: boolean;
}

export interface ValidateDiscountResult {
  isValid: boolean;
  discount?: DiscountProfile;
  discountAmount?: number;
  reason?: string;
}
