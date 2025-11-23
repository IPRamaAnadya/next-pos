export class Discount {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly code: string | null,
    public readonly name: string,
    public readonly description: string | null,
    public readonly type: string,
    public readonly value: number,
    public readonly validFrom: Date | null,
    public readonly validTo: Date | null,
    public readonly minPurchase: number | null,
    public readonly maxDiscount: number | null,
    public readonly applicableItems: any | null,
    public readonly rewardType: string | null,
    public readonly isMemberOnly: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  // Business logic methods
  public isValid(): boolean {
    return this.name.length > 0 && this.value > 0;
  }

  public isActive(): boolean {
    const now = new Date();
    
    if (this.validFrom && now < this.validFrom) {
      return false;
    }
    
    if (this.validTo && now > this.validTo) {
      return false;
    }
    
    return true;
  }

  public isPercentageType(): boolean {
    return this.type.toLowerCase() === 'percentage';
  }

  public isFixedAmountType(): boolean {
    return this.type.toLowerCase() === 'fixed_amount' || this.type.toLowerCase() === 'fixed';
  }

  public canApplyToAmount(amount: number): boolean {
    if (this.minPurchase && amount < this.minPurchase) {
      return false;
    }
    return true;
  }

  public calculateDiscountAmount(amount: number): number {
    if (!this.canApplyToAmount(amount)) {
      return 0;
    }

    let discountAmount = 0;

    if (this.isPercentageType()) {
      discountAmount = (amount * this.value) / 100;
    } else if (this.isFixedAmountType()) {
      discountAmount = this.value;
    }

    // Apply maximum discount limit if set
    if (this.maxDiscount && discountAmount > this.maxDiscount) {
      discountAmount = this.maxDiscount;
    }

    return Math.min(discountAmount, amount); // Cannot discount more than the amount
  }

  public getDisplayName(): string {
    return this.name.trim();
  }

  public getDisplayValue(): string {
    if (this.isPercentageType()) {
      return `${this.value}%`;
    }
    return `$${this.value}`;
  }
}