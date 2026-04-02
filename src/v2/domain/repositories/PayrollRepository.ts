import { PayrollPeriod } from '../entities/PayrollPeriod';
import { PayrollDetail } from '../entities/PayrollDetail';
import { PayrollSetting } from '../entities/PayrollSetting';
import { Salary } from '../entities/Salary';

// PayrollPeriod Repository Interface
export interface PayrollPeriodRepository {
  findById(id: string): Promise<PayrollPeriod | null>;
  findByTenant(tenantId: string, includeFinalized?: boolean): Promise<PayrollPeriod[]>;
  findCurrent(tenantId: string): Promise<PayrollPeriod | null>;
  findByDateRange(tenantId: string, startDate: Date, endDate: Date): Promise<PayrollPeriod[]>;
  findOverlapping(tenantId: string, startDate: Date, endDate: Date, excludeId?: string): Promise<PayrollPeriod[]>;
  create(period: PayrollPeriod): Promise<PayrollPeriod>;
  update(id: string, period: PayrollPeriod): Promise<PayrollPeriod>;
  delete(id: string): Promise<void>;
  finalize(id: string): Promise<PayrollPeriod>;
}

// Enhanced PayrollDetail Repository Interface
export interface PayrollDetailRepository {
  findById(id: string): Promise<PayrollDetail | null>;
  findByPeriod(payrollPeriodId: string): Promise<PayrollDetail[]>;
  findByPeriodAndStaff(payrollPeriodId: string, staffId: string): Promise<PayrollDetail | null>;
  findByStaff(staffId: string, includeUnpaid?: boolean): Promise<PayrollDetail[]>;
  findByTenant(tenantId: string, isPaid?: boolean): Promise<PayrollDetail[]>;
  findUnpaidByTenant(tenantId: string): Promise<PayrollDetail[]>;
  findByDateRange(tenantId: string, startDate: Date, endDate: Date): Promise<PayrollDetail[]>;
  create(detail: PayrollDetail): Promise<PayrollDetail>;
  update(id: string, detail: PayrollDetail): Promise<PayrollDetail>;
  delete(id: string): Promise<void>;
  markAsPaid(id: string): Promise<PayrollDetail>;
  bulkCreate(details: PayrollDetail[]): Promise<PayrollDetail[]>;
  bulkUpdate(details: { id: string; detail: PayrollDetail }[]): Promise<PayrollDetail[]>;
  bulkMarkAsPaid(ids: string[]): Promise<PayrollDetail[]>;
}

// PayrollSetting Repository Interface
export interface PayrollSettingRepository {
  findByTenant(tenantId: string): Promise<PayrollSetting | null>;
  create(setting: PayrollSetting): Promise<PayrollSetting>;
  update(tenantId: string, setting: PayrollSetting): Promise<PayrollSetting>;
  delete(tenantId: string): Promise<void>;
}

// Enhanced Salary Repository Interface (extending existing)
export interface SalaryRepository {
  findById(id: string): Promise<Salary | null>;
  findByStaff(staffId: string): Promise<Salary | null>;
  findByTenant(tenantId: string): Promise<Salary[]>;
  findByTenantWithPagination(tenantId: string, page: number, limit: number): Promise<{
    salaries: Salary[];
    total: number;
    page: number;
    limit: number;
  }>;
  create(salary: Salary): Promise<Salary>;
  update(staffId: string, salary: Salary): Promise<Salary>;
  delete(staffId: string): Promise<void>;
  findAboveAmount(tenantId: string, minimumAmount: number): Promise<Salary[]>;
  findBelowAmount(tenantId: string, maximumAmount: number): Promise<Salary[]>;
  findByType(tenantId: string, type: 'MONTHLY' | 'DAILY' | 'HOURLY'): Promise<Salary[]>;
}