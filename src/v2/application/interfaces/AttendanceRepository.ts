import { Attendance } from '../../domain/entities/Attendance';

export interface AttendanceRepository {
  create(attendance: Attendance): Promise<Attendance>;
  findById(id: string): Promise<Attendance | null>;
  findByStaff(staffId: string, startDate?: Date, endDate?: Date): Promise<Attendance[]>;
  findByTenant(tenantId: string, startDate?: Date, endDate?: Date): Promise<Attendance[]>;
  findByStaffAndDate(staffId: string, date: Date): Promise<Attendance[]>;
  findByStaffAndDateRange(staffId: string, startDate: Date, endDate: Date): Promise<Attendance[]>;
  findByShift(shiftId: string, startDate?: Date, endDate?: Date): Promise<Attendance[]>;
  update(id: string, attendance: Attendance): Promise<Attendance>;
  delete(id: string): Promise<void>;
}