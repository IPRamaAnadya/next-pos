import { attendanceRepository } from './attendance.repository';
import type { AttendanceQueryInput, CheckInInput, CheckOutInput, UpdateAttendanceInput } from './attendance.type';

const TIME_REGEX = /^\d{2}:\d{2}$/;

function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function calcHours(checkInTime: string, checkOutTime: string): number {
  let diff = parseTimeToMinutes(checkOutTime) - parseTimeToMinutes(checkInTime);
  if (diff < 0) diff += 24 * 60; // crosses midnight
  return Math.round((diff / 60) * 100) / 100;
}

class AttendanceService {
  async listAttendance(tenantId: string, query: AttendanceQueryInput) {
    const { items, total } = await attendanceRepository.findAll(tenantId, query);
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 20));
    return {
      items: items.map((e) => e.toProfile()),
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
  }

  async getAttendance(id: string, tenantId: string) {
    const entity = await attendanceRepository.findById(id, tenantId);
    if (!entity) throw new Error('Attendance record not found');
    return entity.toProfile();
  }

  async checkIn(tenantId: string, input: CheckInInput) {
    if (!input.staffId) throw new Error('staffId is required');
    if (!input.checkInTime) throw new Error('checkInTime is required');
    if (!TIME_REGEX.test(input.checkInTime)) throw new Error('checkInTime must be in HH:mm format');

    const staffExists = await attendanceRepository.staffExistsInTenant(input.staffId, tenantId);
    if (!staffExists) throw new Error('Staff not found');

    // Normalise date to midnight UTC
    let date: Date;
    if (input.date) {
      date = new Date(input.date + 'T00:00:00.000Z');
    } else {
      const now = new Date();
      date = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    }

    const existing = await attendanceRepository.findByStaffAndDate(input.staffId, tenantId, date);
    if (existing) {
      if (existing.hasCheckedIn()) throw new Error('Staff has already checked in for this date');
      const updated = await attendanceRepository.update(existing.toProfile().id, tenantId, {
        checkInTime: input.checkInTime,
      });
      return updated.toProfile();
    }

    const isWeekend = input.isWeekend ?? (date.getUTCDay() === 0 || date.getUTCDay() === 6);
    const entity = await attendanceRepository.create(tenantId, {
      staffId: input.staffId,
      date,
      checkInTime: input.checkInTime,
      shiftId: input.shiftId,
      isWeekend,
    });
    return entity.toProfile();
  }

  async checkOut(tenantId: string, input: CheckOutInput) {
    if (!input.attendanceId) throw new Error('attendanceId is required');
    if (!input.checkOutTime) throw new Error('checkOutTime is required');
    if (!TIME_REGEX.test(input.checkOutTime)) throw new Error('checkOutTime must be in HH:mm format');

    const entity = await attendanceRepository.findById(input.attendanceId, tenantId);
    if (!entity) throw new Error('Attendance record not found');
    if (!entity.hasCheckedIn()) throw new Error('Staff has not checked in yet');
    if (entity.hasCheckedOut()) throw new Error('Staff has already checked out');

    const profile = entity.toProfile();
    const totalHours = calcHours(profile.checkInTime!, input.checkOutTime);

    const updated = await attendanceRepository.update(input.attendanceId, tenantId, {
      checkOutTime: input.checkOutTime,
      totalHours,
    });
    return updated.toProfile();
  }

  async updateAttendance(id: string, tenantId: string, input: UpdateAttendanceInput) {
    const entity = await attendanceRepository.findById(id, tenantId);
    if (!entity) throw new Error('Attendance record not found');

    if (input.checkInTime !== undefined && !TIME_REGEX.test(input.checkInTime)) {
      throw new Error('checkInTime must be in HH:mm format');
    }
    if (input.checkOutTime !== undefined && !TIME_REGEX.test(input.checkOutTime)) {
      throw new Error('checkOutTime must be in HH:mm format');
    }

    // Recalculate totalHours if both times are present
    const profile = entity.toProfile();
    const newCheckIn = input.checkInTime ?? profile.checkInTime;
    const newCheckOut = input.checkOutTime ?? profile.checkOutTime;
    let totalHours: number | null | undefined = input.totalHours;
    if (totalHours === undefined && newCheckIn && newCheckOut) {
      totalHours = calcHours(newCheckIn, newCheckOut);
    }

    const updated = await attendanceRepository.update(id, tenantId, { ...input, totalHours });
    return updated.toProfile();
  }

  async deleteAttendance(id: string, tenantId: string) {
    const entity = await attendanceRepository.findById(id, tenantId);
    if (!entity) throw new Error('Attendance record not found');
    await attendanceRepository.delete(id, tenantId);
  }
}

export const attendanceService = new AttendanceService();
