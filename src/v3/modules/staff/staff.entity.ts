import type { Staff, Salary } from '@/app/generated/prisma';
import { Decimal } from '@/app/generated/prisma/runtime/library';
import type { StaffProfile, SalaryProfile } from './staff.type';

// ─────────────────────────────────────────────
//  SalaryEntity
// ─────────────────────────────────────────────

export class SalaryEntity {
  constructor(readonly salary: Salary) {}

  toProfile(): SalaryProfile {
    const s = this.salary;
    return {
      id: s.id,
      staffId: s.staffId,
      tenantId: s.tenantId,
      basicSalary: s.basicSalary instanceof Decimal ? s.basicSalary.toNumber() : Number(s.basicSalary),
      fixedAllowance: s.fixedAllowance instanceof Decimal ? s.fixedAllowance.toNumber() : Number(s.fixedAllowance),
      type: s.type as SalaryProfile['type'],
      createdAt: s.createdAt ?? null,
      updatedAt: s.updatedAt ?? null,
    };
  }
}

// ─────────────────────────────────────────────
//  StaffEntity
// ─────────────────────────────────────────────

export class StaffEntity {
  constructor(readonly staff: Staff & { salary?: Salary | null }) {}

  isOwnerStaff(): boolean {
    return this.staff.isOwner;
  }

  isManager(): boolean {
    return this.staff.role === 'MANAGER';
  }

  isCashier(): boolean {
    return this.staff.role === 'CASHIER';
  }

  toProfile(includeSalary = false): StaffProfile {
    const s = this.staff;
    const profile: StaffProfile = {
      id: s.id,
      tenantId: s.tenantId ?? null,
      isOwner: s.isOwner,
      role: s.role,
      username: s.username,
      createdAt: s.createdAt ?? null,
      updatedAt: s.updatedAt ?? null,
    };

    if (includeSalary) {
      profile.salary = s.salary ? new SalaryEntity(s.salary).toProfile() : null;
    }

    return profile;
  }
}
