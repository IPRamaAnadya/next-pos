import { Shift } from '../entities/Shift';

export interface ShiftQueryOptions {
  limit: number;
  page: number;
  sortBy: string;
  sortDir: 'asc' | 'desc';
  filters?: {
    name?: string;
    isActive?: boolean;
    startTime?: string;
    endTime?: string;
  };
}

export interface ShiftCreateData {
  tenantId: string;
  name: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
  calculateBeforeStartTime: boolean;
  hasBreakTime: boolean;
  breakDuration: number;
  minWorkingHours: number;
  maxWorkingHours: number;
  overtimeMultiplier: number;
  lateThreshold: number;
  earlyCheckInAllowed: number;
  color: string;
  description?: string;
}

export interface IShiftRepository {
  findById(id: string, tenantId: string): Promise<Shift | null>;
  findAll(tenantId: string, options: ShiftQueryOptions): Promise<PaginatedShifts>;
  findActiveShifts(tenantId: string): Promise<Shift[]>;
  findByName(name: string, tenantId: string): Promise<Shift | null>;
  create(shift: ShiftCreateData): Promise<Shift>;
  update(id: string, tenantId: string, updates: Partial<Shift>): Promise<Shift>;
  delete(id: string, tenantId: string): Promise<void>;
  toggleActive(id: string, tenantId: string, isActive: boolean): Promise<Shift>;
}

export interface PaginatedShifts {
  data: Shift[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}