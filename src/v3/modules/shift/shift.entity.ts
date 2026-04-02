import type { Shift } from '@/app/generated/prisma';
import type { ShiftProfile } from './shift.type';

export class ShiftEntity {
  constructor(readonly shift: Shift) {}

  isActive(): boolean {
    return this.shift.isActive;
  }

  toProfile(): ShiftProfile {
    const s = this.shift;
    return {
      id: s.id,
      tenantId: s.tenantId,
      name: s.name,
      startTime: s.startTime,
      endTime: s.endTime,
      isActive: s.isActive,
      calculateBeforeStartTime: s.calculateBeforeStartTime,
      hasBreakTime: s.hasBreakTime,
      breakDuration: s.breakDuration,
      minWorkingHours: s.minWorkingHours,
      maxWorkingHours: s.maxWorkingHours,
      overtimeMultiplier: s.overtimeMultiplier,
      lateThreshold: s.lateThreshold,
      earlyCheckInAllowed: s.earlyCheckInAllowed,
      color: s.color,
      description: s.description ?? null,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    };
  }
}
