// ─────────────────────────────────────────────
//  Enum-like types
// ─────────────────────────────────────────────

export type StaffRole = 'MANAGER' | 'CASHIER';
export type SalaryType = 'MONTHLY' | 'HOURLY';
export type LeaveType = 'SICK' | 'LEAVE' | 'PERMIT' | 'ABSENT' | 'OTHER';

// ─────────────────────────────────────────────
//  Profiles
// ─────────────────────────────────────────────

export interface SalaryProfile {
  id: string;
  staffId: string;
  tenantId: string;
  basicSalary: number;
  fixedAllowance: number;
  type: SalaryType;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface StaffLeaveProfile {
  id: string;
  staffId: string;
  type: LeaveType;
  reason: string | null;
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface StaffProfile {
  id: string;
  tenantId: string | null;
  isOwner: boolean;
  role: string;
  username: string;
  createdAt: Date | null;
  updatedAt: Date | null;
  salary?: SalaryProfile | null;
}

// ─────────────────────────────────────────────
//  Input types
// ─────────────────────────────────────────────

export interface CreateStaffInput {
  username: string;
  password: string;
  role: string;
  isOwner?: boolean;
}

export interface UpdateStaffInput {
  username?: string;
  password?: string;
  role?: string;
}

export interface StaffQueryInput {
  page?: number;
  pageSize?: number;
  search?: string;
  role?: string;
  isOwner?: boolean;
}

export interface UpsertSalaryInput {
  basicSalary: number;
  fixedAllowance?: number;
  type?: SalaryType;
}

export interface CreateStaffLeaveInput {
  type: LeaveType;
  reason?: string;
  startDate: Date;
  endDate: Date;
}

export interface UpdateStaffLeaveInput {
  type?: LeaveType;
  reason?: string;
  startDate?: Date;
  endDate?: Date;
}
