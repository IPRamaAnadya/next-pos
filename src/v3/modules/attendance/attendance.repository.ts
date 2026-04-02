import prisma from '@/v3/lib/prisma';
import { Decimal } from '@/app/generated/prisma/runtime/library';
import { AttendanceEntity } from './attendance.entity';
import type { AttendanceQueryInput, UpdateAttendanceInput } from './attendance.type';

// ─────────────────────────────────────────────
//  Types
// ─────────────────────────────────────────────

export interface CreateAttendanceData {
  staffId: string;
  date: Date;
  checkInTime?: string;
  checkOutTime?: string;
  shiftId?: string;
  isWeekend?: boolean;
  totalHours?: number;
}

// ─────────────────────────────────────────────
//  Interface
// ─────────────────────────────────────────────

export interface IAttendanceRepository {
  findAll(tenantId: string, query: AttendanceQueryInput): Promise<{ items: AttendanceEntity[]; total: number }>;
  findById(id: string, tenantId: string): Promise<AttendanceEntity | null>;
  findByStaffAndDate(staffId: string, tenantId: string, date: Date): Promise<AttendanceEntity | null>;
  staffExistsInTenant(staffId: string, tenantId: string): Promise<boolean>;
  create(tenantId: string, data: CreateAttendanceData): Promise<AttendanceEntity>;
  update(id: string, tenantId: string, data: UpdateAttendanceInput): Promise<AttendanceEntity>;
  delete(id: string, tenantId: string): Promise<void>;
}

// ─────────────────────────────────────────────
//  Prisma implementation
// ─────────────────────────────────────────────

class PrismaAttendanceRepository implements IAttendanceRepository {
  async findAll(
    tenantId: string,
    query: AttendanceQueryInput,
  ): Promise<{ items: AttendanceEntity[]; total: number }> {
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 20));
    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = { tenantId };
    if (query.staffId) where.staffId = query.staffId;
    if (query.isWeekend !== undefined) where.isWeekend = query.isWeekend;
    if (query.startDate || query.endDate) {
      const dateFilter: Record<string, Date> = {};
      if (query.startDate) dateFilter.gte = new Date(query.startDate);
      if (query.endDate) dateFilter.lte = new Date(query.endDate);
      where.date = dateFilter;
    }

    const [rows, total] = await Promise.all([
      prisma.attendance.findMany({
        where,
        include: { staff: true },
        orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: pageSize,
      }),
      prisma.attendance.count({ where }),
    ]);

    return { items: rows.map((r) => new AttendanceEntity(r)), total };
  }

  async findById(id: string, tenantId: string): Promise<AttendanceEntity | null> {
    const row = await prisma.attendance.findFirst({
      where: { id, tenantId },
      include: { staff: true },
    });
    return row ? new AttendanceEntity(row) : null;
  }

  async findByStaffAndDate(staffId: string, tenantId: string, date: Date): Promise<AttendanceEntity | null> {
    const row = await prisma.attendance.findFirst({
      where: { staffId, tenantId, date },
      include: { staff: true },
    });
    return row ? new AttendanceEntity(row) : null;
  }

  async staffExistsInTenant(staffId: string, tenantId: string): Promise<boolean> {
    const count = await prisma.staff.count({ where: { id: staffId, tenantId } });
    return count > 0;
  }

  async create(tenantId: string, data: CreateAttendanceData): Promise<AttendanceEntity> {
    const row = await prisma.attendance.create({
      data: {
        tenantId,
        staffId: data.staffId,
        date: data.date,
        checkInTime: data.checkInTime ?? null,
        checkOutTime: data.checkOutTime ?? null,
        shiftId: data.shiftId ?? null,
        isWeekend: data.isWeekend ?? false,
        totalHours: data.totalHours != null ? new Decimal(data.totalHours) : null,
      },
      include: { staff: true },
    });
    return new AttendanceEntity(row);
  }

  async update(id: string, tenantId: string, data: UpdateAttendanceInput): Promise<AttendanceEntity> {
    const row = await prisma.attendance.update({
      where: { id },
      data: {
        ...(data.checkInTime !== undefined && { checkInTime: data.checkInTime }),
        ...(data.checkOutTime !== undefined && { checkOutTime: data.checkOutTime }),
        ...(data.shiftId !== undefined && { shiftId: data.shiftId }),
        ...(data.isWeekend !== undefined && { isWeekend: data.isWeekend }),
        ...(data.totalHours !== undefined && {
          totalHours: data.totalHours != null ? new Decimal(data.totalHours) : null,
        }),
      },
      include: { staff: true },
    });
    return new AttendanceEntity(row);
  }

  async delete(id: string, tenantId: string): Promise<void> {
    await prisma.attendance.deleteMany({ where: { id, tenantId } });
  }
}

export const attendanceRepository = new PrismaAttendanceRepository();
