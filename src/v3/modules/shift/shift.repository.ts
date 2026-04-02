import prisma from '@/v3/lib/prisma';
import { ShiftEntity } from './shift.entity';
import type { CreateShiftInput, ShiftQueryInput, UpdateShiftInput } from './shift.type';

// ─────────────────────────────────────────────
//  Interface
// ─────────────────────────────────────────────

export interface IShiftRepository {
  findAll(tenantId: string, query: ShiftQueryInput): Promise<{ items: ShiftEntity[]; total: number }>;
  findById(id: string, tenantId: string): Promise<ShiftEntity | null>;
  findByName(name: string, tenantId: string, excludeId?: string): Promise<ShiftEntity | null>;
  findActive(tenantId: string): Promise<ShiftEntity[]>;
  create(tenantId: string, data: CreateShiftInput): Promise<ShiftEntity>;
  update(id: string, tenantId: string, data: UpdateShiftInput): Promise<ShiftEntity>;
  delete(id: string, tenantId: string): Promise<void>;
}

// ─────────────────────────────────────────────
//  Prisma implementation
// ─────────────────────────────────────────────

class PrismaShiftRepository implements IShiftRepository {
  async findAll(tenantId: string, query: ShiftQueryInput): Promise<{ items: ShiftEntity[]; total: number }> {
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 20));
    const skip = (page - 1) * pageSize;

    const where = {
      tenantId,
      ...(query.search && { name: { contains: query.search, mode: 'insensitive' as const } }),
      ...(query.isActive !== undefined && { isActive: query.isActive }),
    };

    const [rows, total] = await Promise.all([
      prisma.shift.findMany({ where, orderBy: { name: 'asc' }, skip, take: pageSize }),
      prisma.shift.count({ where }),
    ]);

    return { items: rows.map((r) => new ShiftEntity(r)), total };
  }

  async findById(id: string, tenantId: string): Promise<ShiftEntity | null> {
    const row = await prisma.shift.findFirst({ where: { id, tenantId } });
    return row ? new ShiftEntity(row) : null;
  }

  async findByName(name: string, tenantId: string, excludeId?: string): Promise<ShiftEntity | null> {
    const row = await prisma.shift.findFirst({
      where: { name, tenantId, ...(excludeId && { id: { not: excludeId } }) },
    });
    return row ? new ShiftEntity(row) : null;
  }

  async findActive(tenantId: string): Promise<ShiftEntity[]> {
    const rows = await prisma.shift.findMany({
      where: { tenantId, isActive: true },
      orderBy: { name: 'asc' },
    });
    return rows.map((r) => new ShiftEntity(r));
  }

  async create(tenantId: string, data: CreateShiftInput): Promise<ShiftEntity> {
    const row = await prisma.shift.create({
      data: {
        tenantId,
        name: data.name,
        startTime: data.startTime,
        endTime: data.endTime,
        isActive: data.isActive ?? true,
        calculateBeforeStartTime: data.calculateBeforeStartTime ?? true,
        hasBreakTime: data.hasBreakTime ?? false,
        breakDuration: data.breakDuration ?? 0,
        minWorkingHours: data.minWorkingHours ?? 8,
        maxWorkingHours: data.maxWorkingHours ?? 8,
        overtimeMultiplier: data.overtimeMultiplier ?? 1.5,
        lateThreshold: data.lateThreshold ?? 15,
        earlyCheckInAllowed: data.earlyCheckInAllowed ?? 30,
        color: data.color ?? '#3B82F6',
        description: data.description ?? null,
      },
    });
    return new ShiftEntity(row);
  }

  async update(id: string, tenantId: string, data: UpdateShiftInput): Promise<ShiftEntity> {
    const row = await prisma.shift.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.startTime !== undefined && { startTime: data.startTime }),
        ...(data.endTime !== undefined && { endTime: data.endTime }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.calculateBeforeStartTime !== undefined && {
          calculateBeforeStartTime: data.calculateBeforeStartTime,
        }),
        ...(data.hasBreakTime !== undefined && { hasBreakTime: data.hasBreakTime }),
        ...(data.breakDuration !== undefined && { breakDuration: data.breakDuration }),
        ...(data.minWorkingHours !== undefined && { minWorkingHours: data.minWorkingHours }),
        ...(data.maxWorkingHours !== undefined && { maxWorkingHours: data.maxWorkingHours }),
        ...(data.overtimeMultiplier !== undefined && { overtimeMultiplier: data.overtimeMultiplier }),
        ...(data.lateThreshold !== undefined && { lateThreshold: data.lateThreshold }),
        ...(data.earlyCheckInAllowed !== undefined && { earlyCheckInAllowed: data.earlyCheckInAllowed }),
        ...(data.color !== undefined && { color: data.color }),
        ...(data.description !== undefined && { description: data.description }),
      },
    });
    return new ShiftEntity(row);
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const hasAssignments = await prisma.staffShift.count({ where: { shiftId: id, tenantId } });
    if (hasAssignments > 0) throw new Error('Cannot delete a shift that has staff assignments');

    await prisma.shift.deleteMany({ where: { id, tenantId } });
  }
}

export const shiftRepository = new PrismaShiftRepository();
