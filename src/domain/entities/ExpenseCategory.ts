export class ExpenseCategory {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly name: string,
    public readonly code: string,
    public readonly isPrivate: boolean,
    public readonly createdAt: Date,
  ) {}

  // Business logic methods
  public isValid(): boolean {
    return this.name.length > 0 && this.code.length > 0;
  }

  public isVisibleToRole(isCashier: boolean): boolean {
    if (!isCashier) return true; // Admin can see all categories
    return !this.isPrivate; // Cashier can only see non-private categories
  }

  public canBeUsedByRole(isCashier: boolean): boolean {
    return this.isVisibleToRole(isCashier);
  }

  public hasValidCode(): boolean {
    return this.code.length >= 2 && this.code.length <= 10;
  }

  public isSystemCategory(): boolean {
    // You can define system categories that cannot be deleted
    const systemCodes = ['SYSTEM', 'DEFAULT', 'PAYROLL'];
    return systemCodes.includes(this.code.toUpperCase());
  }

  public getDisplayName(): string {
    return `${this.name} (${this.code})`;
  }

  public static createNew(
    tenantId: string,
    name: string,
    code: string,
    isPrivate: boolean = false
  ): { tenantId: string; name: string; code: string; isPrivate: boolean } {
    if (!name || name.trim().length === 0) {
      throw new Error('Category name is required');
    }
    
    if (!code || code.trim().length === 0) {
      throw new Error('Category code is required');
    }
    
    return {
      tenantId,
      name: name.trim(),
      code: code.trim().toUpperCase(),
      isPrivate,
    };
  }
}