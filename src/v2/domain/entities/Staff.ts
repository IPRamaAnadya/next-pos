export class Staff {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly isOwner: boolean,
    public readonly role: string,
    public readonly username: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  // Business logic methods
  public isValid(): boolean {
    return this.username.length >= 3 && this.role.length > 0;
  }

  public isManager(): boolean {
    return this.role === 'MANAGER' || this.isOwner;
  }

  public isCashier(): boolean {
    return this.role === 'CASHIER';
  }

  public canManageStaff(): boolean {
    return this.isOwner || this.role === 'MANAGER';
  }

  public canViewPayroll(): boolean {
    return this.isOwner || this.role === 'MANAGER';
  }

  public canEditOwnProfile(): boolean {
    return true;
  }

  public canEditStaff(targetStaffId: string): boolean {
    if (this.id === targetStaffId) return true;
    return this.canManageStaff();
  }

  public static createNew(
    tenantId: string,
    username: string,
    role: string,
    isOwner: boolean = false
  ): { tenantId: string; isOwner: boolean; role: string; username: string } {
    return {
      tenantId,
      isOwner,
      role,
      username,
    };
  }
}