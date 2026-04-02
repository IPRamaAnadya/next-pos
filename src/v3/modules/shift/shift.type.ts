// ─────────────────────────────────────────────
//  Profiles
// ─────────────────────────────────────────────

export interface ShiftProfile {
  id: string;
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
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// ─────────────────────────────────────────────
//  Input types
// ─────────────────────────────────────────────

export interface CreateShiftInput {
  name: string;
  startTime: string;  // "HH:mm"
  endTime: string;    // "HH:mm"
  isActive?: boolean;
  calculateBeforeStartTime?: boolean;
  hasBreakTime?: boolean;
  breakDuration?: number;
  minWorkingHours?: number;
  maxWorkingHours?: number;
  overtimeMultiplier?: number;
  lateThreshold?: number;
  earlyCheckInAllowed?: number;
  color?: string;
  description?: string;
}

export type UpdateShiftInput = Partial<CreateShiftInput>;

export interface ShiftQueryInput {
  page?: number;
  pageSize?: number;
  search?: string;
  isActive?: boolean;
}
