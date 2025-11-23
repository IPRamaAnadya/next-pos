export class AuthSession {
  constructor(
    public readonly userId: string,
    public readonly tenantId: string | null,
    public readonly role: string,
    public readonly staffId: string | null,
    public readonly token: string,
    public readonly expiresAt: Date,
    public readonly subscriptionEndDate: Date | null,
  ) {}

  // Business logic methods
  public isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  public isValid(): boolean {
    return !this.isExpired() && !!this.token && !!this.userId;
  }

  public hasRole(requiredRoles: string[]): boolean {
    return requiredRoles.includes(this.role);
  }

  public belongsToTenant(tenantId: string): boolean {
    return this.tenantId === tenantId;
  }

  public isOwner(): boolean {
    return this.role === 'owner';
  }

  public isStaff(): boolean {
    return this.role === 'staff' || this.role === 'manager' || this.role === 'cashier';
  }

  public hasSubscriptionExpired(): boolean {
    if (!this.subscriptionEndDate) return false;
    return new Date() > this.subscriptionEndDate;
  }

  public toTokenPayload() {
    return {
      userId: this.userId,
      tenantId: this.tenantId,
      role: this.role,
      staffId: this.staffId,
      subscriptionEndDate: this.subscriptionEndDate?.toISOString() || null,
    };
  }
}