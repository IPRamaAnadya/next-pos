import { Staff } from '../entities/Staff';
import { Salary } from '../entities/Salary';
import { Attendance } from '../entities/Attendance';
import { PayrollDetail } from '../entities/PayrollDetail';
import { StaffQueryOptions } from '../../application/use-cases/interfaces/StaffQueryOptions';

export interface StaffRepository {
  findById(id: string, tenantId: string): Promise<Staff | null>;
  findAll(tenantId: string, options: StaffQueryOptions): Promise<PaginatedStaffs>;
  create(staff: { tenantId: string; username: string; role: string; isOwner: boolean; hashedPassword: string }): Promise<Staff>;
  update(id: string, tenantId: string, updates: Partial<{ username: string; role: string; hashedPassword?: string }>): Promise<Staff>;
  delete(id: string, tenantId: string): Promise<void>;
  findByUsername(username: string, tenantId: string): Promise<Staff | null>;
  findByUsernameWithPassword(username: string, tenantId: string): Promise<{ staff: Staff; password: string } | null>;
  checkUsernameUniqueness(username: string, tenantId: string, excludeId?: string): Promise<boolean>;
  countStaffsByTenant(tenantId: string): Promise<number>;
}

export interface SalaryRepository {
  findByStaffId(staffId: string, tenantId: string): Promise<Salary | null>;
  create(salary: { tenantId: string; staffId: string; basicSalary: number; fixedAllowance: number; type: 'MONTHLY' | 'HOURLY' }): Promise<Salary>;
  update(staffId: string, tenantId: string, updates: Partial<{ basicSalary: number; fixedAllowance: number; type: 'MONTHLY' | 'HOURLY' }>): Promise<Salary>;
  delete(staffId: string, tenantId: string): Promise<void>;
  findAll(tenantId: string): Promise<Salary[]>;
}

export interface AttendanceRepository {
  findById(id: string, tenantId: string): Promise<Attendance | null>;
  findByStaffAndDate(staffId: string, date: Date, tenantId: string): Promise<Attendance | null>;
  findByStaffAndDateRange(staffId: string, startDate: Date, endDate: Date, tenantId: string): Promise<Attendance[]>;
  create(attendance: { tenantId: string; staffId: string; date: Date; checkInTime?: string; checkOutTime?: string; isWeekend: boolean }): Promise<Attendance>;
  update(id: string, tenantId: string, updates: Partial<{ checkInTime: string; checkOutTime: string; totalHours: number }>): Promise<Attendance>;
  delete(id: string, tenantId: string): Promise<void>;
  findAll(tenantId: string, staffId?: string, startDate?: Date, endDate?: Date): Promise<Attendance[]>;
}

export interface PayrollDetailRepository {
  findById(id: string, tenantId: string): Promise<PayrollDetail | null>;
  findByPeriodAndStaff(payrollPeriodId: string, staffId: string, tenantId: string): Promise<PayrollDetail | null>;
  findByPeriod(payrollPeriodId: string, tenantId: string): Promise<PayrollDetail[]>;
  create(payrollDetail: {
    tenantId: string;
    payrollPeriodId: string;
    staffId: string;
    basicSalaryAmount: number;
    fixedAllowanceAmount: number;
    overtimeHours: number;
    overtimePay: number;
    bonusAmount: number;
    deductionsAmount: number;
    takeHomePay: number;
  }): Promise<PayrollDetail>;
  update(id: string, tenantId: string, updates: Partial<{
    basicSalaryAmount: number;
    fixedAllowanceAmount: number;
    overtimeHours: number;
    overtimePay: number;
    bonusAmount: number;
    deductionsAmount: number;
    takeHomePay: number;
    isPaid: boolean;
    paidAt: Date;
  }>): Promise<PayrollDetail>;
  delete(id: string, tenantId: string): Promise<void>;
  findAll(tenantId: string, isPaid?: boolean): Promise<PayrollDetail[]>;
}

export interface PaginatedStaffs {
  data: Staff[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}