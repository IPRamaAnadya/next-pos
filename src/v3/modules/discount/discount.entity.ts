import { Decimal } from '@/app/generated/prisma/runtime/library';
import type { DiscountProfile, DiscountType } from './discount.type';

export class DiscountEntity {
  readonly id: string;
  readonly tenantId: string | null;
  readonly code: string | null;
  readonly name: string;
  readonly description: string | null;
  readonly type: string;
  readonly value: Decimal;
  readonly validFrom: Date | null;
  readonly validTo: Date | null;
  readonly minPurchase: Decimal | null;
  readonly maxDiscount: Decimal | null;
  readonly applicableItems: unknown;
  readonly rewardType: string | null;
  readonly isMemberOnly: boolean;
  readonly createdAt: Date | null;
  readonly updatedAt: Date | null;

  constructor(data: {
    id: string;
    tenantId?: string | null;
    code?: string | null;
    name: string;
    description?: string | null;
    type: string;
    value: Decimal;
    validFrom?: Date | null;
    validTo?: Date | null;
    minPurchase?: Decimal | null;
    maxDiscount?: Decimal | null;
    applicableItems?: unknown;
    rewardType?: string | null;
    isMemberOnly?: boolean | null;
    createdAt?: Date | null;
    updatedAt?: Date | null;
  }) {
    this.id = data.id;
    this.tenantId = data.tenantId ?? null;
    this.code = data.code ?? null;
    this.name = data.name;
    this.description = data.description ?? null;
    this.type = data.type;
    this.value = data.value;
    this.validFrom = data.validFrom ?? null;
    this.validTo = data.validTo ?? null;
    this.minPurchase = data.minPurchase ?? null;
    this.maxDiscount = data.maxDiscount ?? null;
    this.applicableItems = data.applicableItems ?? null;
    this.rewardType = data.rewardType ?? null;
    this.isMemberOnly = data.isMemberOnly ?? false;
    this.createdAt = data.createdAt ?? null;
    this.updatedAt = data.updatedAt ?? null;
  }

  isActive(): boolean {
    const now = new Date();
    if (this.validFrom && now < this.validFrom) return false;
    if (this.validTo && now > this.validTo) return false;
    return true;
  }

  isPercentage(): boolean {
    return this.type === 'percentage';
  }

  isFixedAmount(): boolean {
    return this.type === 'fixed_amount';
  }

  canApplyToAmount(amount: number): boolean {
    if (!this.minPurchase) return true;
    return amount >= this.minPurchase.toNumber();
  }

  calculateDiscountAmount(orderAmount: number): number {
    if (!this.canApplyToAmount(orderAmount)) return 0;

    let discount = 0;
    const value = this.value.toNumber();

    if (this.isPercentage()) {
      discount = (orderAmount * value) / 100;
    } else {
      discount = value;
    }

    if (this.maxDiscount) {
      discount = Math.min(discount, this.maxDiscount.toNumber());
    }

    return Math.min(discount, orderAmount);
  }

  toProfile(): DiscountProfile {
    return {
      id: this.id,
      tenantId: this.tenantId,
      code: this.code,
      name: this.name,
      description: this.description,
      type: this.type as DiscountType,
      value: this.value.toNumber(),
      validFrom: this.validFrom,
      validTo: this.validTo,
      minPurchase: this.minPurchase ? this.minPurchase.toNumber() : null,
      maxDiscount: this.maxDiscount ? this.maxDiscount.toNumber() : null,
      applicableItems: this.applicableItems,
      rewardType: this.rewardType,
      isMemberOnly: this.isMemberOnly,
      isActive: this.isActive(),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
