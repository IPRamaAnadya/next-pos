export class Tenant {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly name: string,
    public readonly email: string,
    public readonly address: string | null,
    public readonly phone: string | null,
    public readonly subscribedUntil: Date | null,
    public readonly isSubscribed: boolean | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  // Business logic methods
  public isValidName(): boolean {
    return this.name.trim().length > 0;
  }

  public isValidEmail(): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(this.email);
  }

  public hasValidContactInfo(): boolean {
    return this.isValidEmail() && (this.phone ? this.phone.length >= 10 : true);
  }

  public canBeActivated(): boolean {
    return this.isValidName() && this.isValidEmail();
  }

  public belongsToUser(userId: string): boolean {
    return this.userId === userId;
  }

  // Subscription-related business logic
  public isActive(): boolean {
    return this.isSubscribed === true;
  }

  public isSubscriptionExpired(): boolean {
    if (!this.subscribedUntil) return false;
    return new Date() > this.subscribedUntil;
  }

  public canAccess(): boolean {
    return this.isActive() && !this.isSubscriptionExpired();
  }

  public isValid(): boolean {
    return (
      this.isValidName() &&
      this.isValidEmail() &&
      this.userId.length > 0
    );
  }

  public getDisplayName(): string {
    return this.name || this.email;
  }

  public getSubscriptionStatus(): 'active' | 'expired' | 'inactive' {
    if (!this.isSubscribed) return 'inactive';
    if (this.isSubscriptionExpired()) return 'expired';
    return 'active';
  }

  public getDaysUntilExpiry(): number | null {
    if (!this.subscribedUntil) return null;
    const today = new Date();
    const expiry = new Date(this.subscribedUntil);
    const timeDiff = expiry.getTime() - today.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  }

  // Static factory methods
  static create(data: {
    userId: string;
    name: string;
    email: string;
    address?: string;
    phone?: string;
    subscribedUntil?: Date;
    isSubscribed?: boolean;
  }): Omit<Tenant, 'id' | 'createdAt' | 'updatedAt'> {
    return {
      userId: data.userId,
      name: data.name.trim(),
      email: data.email.toLowerCase().trim(),
      address: data.address || null,
      phone: data.phone || null,
      subscribedUntil: data.subscribedUntil || null,
      isSubscribed: data.isSubscribed ?? false,
    };
  }

  // Convert to safe object (for API responses)
  public toSafeObject() {
    return {
      id: this.id,
      userId: this.userId,
      name: this.name,
      email: this.email,
      address: this.address,
      phone: this.phone,
      subscribedUntil: this.subscribedUntil,
      isSubscribed: this.isSubscribed,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      // Computed properties
      canAccess: this.canAccess(),
      subscriptionStatus: this.getSubscriptionStatus(),
      daysUntilExpiry: this.getDaysUntilExpiry(),
    };
  }
}