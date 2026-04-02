import type { Attendance, Staff } from '@/app/generated/prisma';
import { Decimal } from '@/app/generated/prisma/runtime/library';
import type { AttendanceProfile } from './attendance.type';

export class AttendanceEntity {
  constructor(readonly attendance: Attendance & { staff?: Staff | null }) {}

  hasCheckedIn(): boolean {
    return this.attendance.checkInTime !== null;
  }

  hasCheckedOut(): boolean {
    return this.attendance.checkOutTime !== null;
  }

  isComplete(): boolean {
    return this.hasCheckedIn() && this.hasCheckedOut();
  }

  calculateHours(checkInTime?: string, checkOutTime?: string): number | null {
    const inTime = checkInTime ?? this.attendance.checkInTime;
    const outTime = checkOutTime ?? this.attendance.checkOutTime;
    if (!inTime || !outTime) return null;

    const [inH, inM] = inTime.split(':').map(Number);
    const [outH, outM] = outTime.split(':').map(Number);
    let totalMinutes = outH * 60 + outM - (inH * 60 + inM);
    if (totalMinutes < 0) totalMinutes += 24 * 60; // crosses midnight

    return Math.round((totalMinutes / 60) * 100) / 100;
  }

  toProfile(): AttendanceProfile {
    const a = this.attendance;
    return {
      id: a.id,
      tenantId: a.tenantId,
      staffId: a.staffId,
      shiftId: a.shiftId ?? null,
      date: a.date,
      checkInTime: a.checkInTime ?? null,
      checkOutTime: a.checkOutTime ?? null,
      totalHours:
        a.totalHours instanceof Decimal
          ? a.totalHours.toNumber()
          : a.totalHours != null
          ? Number(a.totalHours)
          : null,
      isWeekend: a.isWeekend ?? null,
      createdAt: a.createdAt ?? null,
      updatedAt: a.updatedAt ?? null,
      staff: a.staff
        ? { id: a.staff.id, username: a.staff.username, role: a.staff.role }
        : null,
    };
  }
}
