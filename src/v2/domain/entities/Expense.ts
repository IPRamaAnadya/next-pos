import { Decimal } from '@prisma/client/runtime/library';

export class Expense {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly expenseCategoryId: string,
    public readonly staffId: string,
    public readonly description: string,
    public readonly amount: Decimal,
    public readonly paymentType: string,
    public readonly isShow: boolean,
    public readonly paidAt: Date | null,
    public readonly attachmentUrl: string | null,
    public readonly payrollDetailId: string | null,
    public readonly createdAt: Date,
    // Relations (optional for domain entity)
    public readonly expenseCategory?: {
      id: string;
      name: string;
      code: string;
      isPrivate: boolean;
    },
    public readonly staff?: {
      id: string;
      username: string;
      role: string;
    }
  ) {}

  // Business logic methods
  public isValid(): boolean {
    return this.description.length > 0 && this.amount.toNumber() >= 0;
  }

  public isPaid(): boolean {
    return this.paidAt !== null;
  }

  public isPrivate(): boolean {
    return this.expenseCategory?.isPrivate || false;
  }

  public getAmountAsNumber(): number {
    return this.amount.toNumber();
  }

  public canBeViewedBy(isCashier: boolean): boolean {
    if (!isCashier) return true; // Admin can view all expenses
    return this.isShow && !this.isPrivate();
  }

  public markAsPaid(): void {
    // This would be handled in use cases, but shows domain logic
    if (!this.isPaid()) {
      // Would create new instance with paidAt set
    }
  }
}