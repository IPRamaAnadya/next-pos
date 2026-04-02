export class Customer {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly membershipCode: string | null,
    public readonly name: string,
    public readonly email: string | null,
    public readonly phone: string | null,
    public readonly address: string | null,
    public readonly birthday: Date | null,
    public readonly lastPurchaseAt: Date | null,
    public readonly membershipExpiredAt: Date | null,
    public readonly points: number,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  // Business logic methods
  public isValid(): boolean {
    return this.name.length > 0;
  }

  public hasContactInfo(): boolean {
    return !!(this.email || this.phone);
  }

  public getDisplayName(): string {
    return this.name.trim();
  }

  public isActive(): boolean {
    return !this.membershipExpiredAt || this.membershipExpiredAt > new Date();
  }

  public isMember(): boolean {
    return !!this.membershipCode;
  }
}

export interface CustomerForOrder {
  id: string;
  phone?: string;
  name?: string;
  points: number;
}