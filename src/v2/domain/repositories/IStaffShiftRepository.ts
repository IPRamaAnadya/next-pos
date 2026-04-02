import { StaffShift } from '../entities/StaffShift';

export interface StaffShiftQueryOptions {
  limit: number;
  page: number;
  sortBy: string;
  sortDir: 'asc' | 'desc';
  filters?: {
    staffId?: string;
    shiftId?: string;
    date?: Date;
    dateFrom?: Date;
    dateTo?: string;
    isCompleted?: boolean;
    hasCheckedIn?: boolean;
    hasCheckedOut?: boolean;
  };
}

export interface StaffShiftCreateData {
  tenantId: string;
  staffId: string;
  shiftId: string;
  date: Date;
  checkInTime?: string;
  checkOutTime?: string;
  actualBreakDuration?: number;
  totalWorkedMinutes?: number;
  lateMinutes?: number;
  overtimeMinutes?: number;
  isCompleted?: boolean;
  notes?: string;
}

export interface IStaffShiftRepository {
  findById(id: string, tenantId: string): Promise<StaffShift | null>;
  findAll(tenantId: string, options: StaffShiftQueryOptions): Promise<PaginatedStaffShifts>;
  findByStaffAndDate(staffId: string, date: Date, tenantId: string): Promise<StaffShift[]>;
  findByStaffAndDateRange(staffId: string, startDate: Date, endDate: Date, tenantId: string): Promise<StaffShift[]>;
  findActiveByStaff(staffId: string, tenantId: string): Promise<StaffShift[]>;
  findByShift(shiftId: string, tenantId: string, options: StaffShiftQueryOptions): Promise<PaginatedStaffShifts>;
  findByDateRange(startDate: Date, endDate: Date, tenantId: string, options?: Partial<StaffShiftQueryOptions>): Promise<StaffShift[]>;
  create(staffShift: StaffShiftCreateData): Promise<StaffShift>;
  update(id: string, tenantId: string, updates: Partial<StaffShift>): Promise<StaffShift>;
  delete(id: string, tenantId: string): Promise<void>;
  checkIn(id: string, tenantId: string, checkInTime: string): Promise<StaffShift>;
  checkOut(id: string, tenantId: string, checkOutTime: string, actualBreakDuration?: number): Promise<StaffShift>;
}

export interface PaginatedStaffShifts {
  data: StaffShift[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}