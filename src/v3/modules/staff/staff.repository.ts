import prisma from '@/v3/lib/prisma';
import { Decimal } from '@/app/generated/prisma/runtime/library';
import type { SalaryType, LeaveType } from '@/app/generated/prisma';
import { StaffEntity, SalaryEntity } from './staff.entity';
import type {
  CreateStaffInput,
  StaffQueryInput,
  UpdateStaffInput,
  UpsertSalaryInput,
  CreateStaffLeaveInput,
  UpdateStaffLeaveInput,
  StaffLeaveProfile,
} from './staff.type';

// ─────────────────────────────────────────────
//  Interface
// ─────────────────────────────────────────────

export interface IStaffRepository {
  findAll(tenantId: string, query: StaffQueryInput): Promise<{ items: StaffEntity[]; total: number }>;
  findById(id: string, tenantId: string): Promise<StaffEntity | null>;
  findByUsername(username: string, tenantId: string, excludeId?: string): Promise<StaffEntity | null>;
  countByTenant(tenantId: string): Promise<number>;
  create(tenantId: string, data: CreateStaffInput & { hashedPassword: string }): Promise<StaffEntity>;
  update(id: string, tenantId: string, data: UpdateStaffInput & { hashedPassword?: string }): Promise<StaffEntity>;
  delete(id: string, tenantId: string): Promise<void>;
  // Salary
  findSalaryByStaffId(staffId: string, tenantId: string): Promise<SalaryEntity | null>;
  upsertSalary(staffId: string, tenantId: string, data: UpsertSalaryInput): Promise<SalaryEntity>;
  deleteSalary(staffId: string, tenantId: string): Promise<void>;
  // StaffLeave
  findLeavesByStaffId(staffId: string, type?: string): Promise<StaffLeaveProfile[]>;
  findLeaveById(id: string, staffId: string): Promise<StaffLeaveProfile | null>;
  createLeave(staffId: string, data: CreateStaffLeaveInput): Promise<StaffLeaveProfile>;
  updateLeave(id: string, staffId: string, data: UpdateStaffLeaveInput): Promise<StaffLeaveProfile>;
  deleteLeave(id: string, staffId: string): Promise<void>;
}

// ─────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────

function mapLeaveToProfile(leave: {
  id: string;
  staffId: string;
  type: LeaveType;
  reason: string | null;
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  updatedAt: Date;
}): StaffLeaveProfile {
  return {
    id: leave.id,
    staffId: leave.staffId,
    type: leave.type as StaffLeaveProfile['type'],
    reason: leave.reason ?? null,
    startDate: leave.startDate,
    endDate: leave.endDate,
    createdAt: leave.createdAt,
    updatedAt: leave.updatedAt,
  };
}

// ─────────────────────────────────────────────
//  Prisma implementation
// ─────────────────────────────────────────────

class PrismaStaffRepository implements IStaffRepository {
  async findAll(tenantId: string, query: StaffQueryInput): Promise<{ items: StaffEntity[]; total: number }> {
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 20));
    const skip = (page - 1) * pageSize;

    const where = {
      tenantId,
      ...(query.search && {
        username: { contains: query.search, mode: 'insensitive' as const },
      }),
      ...(query.role && { role: query.role }),
      ...(query.isOwner !== undefined && { isOwner: query.isOwner }),
    };

    const [rows, total] = await Promise.all([
      prisma.staff.findMany({
        where,
        include: { salary: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.staff.count({ where }),
    ]);

    return { items: rows.map((r) => new StaffEntity(r)), total };
  }

  async findById(id: string, tenantId: string): Promise<StaffEntity | null> {
    const row = await prisma.staff.findFirst({
      where: { id, tenantId },
      include: { salary: true },
    });
    return row ? new StaffEntity(row) : null;
  }

  async findByUsername(username: string, tenantId: string, excludeId?: string): Promise<StaffEntity | null> {
    const row = await prisma.staff.findFirst({
      where: { username, tenantId, ...(excludeId && { id: { not: excludeId } }) },
    });
    return row ? new StaffEntity(row) : null;
  }

  async countByTenant(tenantId: string): Promise<number> {
    return prisma.staff.count({ where: { tenantId } });
  }

  async create(
    tenantId: string,
    data: CreateStaffInput & { hashedPassword: string },
  ): Promise<StaffEntity> {
    const row = await prisma.staff.create({
      data: {
        tenantId,
        username: data.username,
        password: data.hashedPassword,
        role: data.role,
        isOwner: data.isOwner ?? false,
      },
      include: { salary: true },
    });
    return new StaffEntity(row);
  }

  async update(
    id: string,
    tenantId: string,
    data: UpdateStaffInput & { hashedPassword?: string },
  ): Promise<StaffEntity> {
    const row = await prisma.staff.update({
      where: { id },
      data: {
        ...(data.username !== undefined && { username: data.username }),
        ...(data.role !== undefined && { role: data.role }),
        ...(data.hashedPassword !== undefined && { password: data.hashedPassword }),
      },
      include: { salary: true },
    });
    return new StaffEntity(row);
  }

  async delete(id: string, tenantId: string): Promise<void> {
    await prisma.staff.deleteMany({ where: { id, tenantId } });
  }

  // ── Salary ────────────────────────────────

  async findSalaryByStaffId(staffId: string, tenantId: string): Promise<SalaryEntity | null> {
    const row = await prisma.salary.findFirst({ where: { staffId, tenantId } });
    return row ? new SalaryEntity(row) : null;
  }

  async upsertSalary(staffId: string, tenantId: string, data: UpsertSalaryInput): Promise<SalaryEntity> {
    const row = await prisma.salary.upsert({
      where: { staffId },
      create: {
        staffId,
        tenantId,
        basicSalary: new Decimal(data.basicSalary),
        fixedAllowance: new Decimal(data.fixedAllowance ?? 0),
        type: (data.type ?? 'MONTHLY') as SalaryType,
      },
      update: {
        basicSalary: new Decimal(data.basicSalary),
        ...(data.fixedAllowance !== undefined && {
          fixedAllowance: new Decimal(data.fixedAllowance),
        }),
        ...(data.type !== undefined && { type: data.type as SalaryType }),
      },
    });
    return new SalaryEntity(row);
  }

  async deleteSalary(staffId: string, tenantId: string): Promise<void> {
    await prisma.salary.deleteMany({ where: { staffId, tenantId } });
  }

  // ── StaffLeave ────────────────────────────

  async findLeavesByStaffId(staffId: string, type?: string): Promise<StaffLeaveProfile[]> {
    const rows = await prisma.staffLeave.findMany({
      where: { staffId, ...(type && { type: type as LeaveType }) },
      orderBy: { startDate: 'desc' },
    });
    return rows.map(mapLeaveToProfile);
  }

  async findLeaveById(id: string, staffId: string): Promise<StaffLeaveProfile | null> {
    const row = await prisma.staffLeave.findFirst({ where: { id, staffId } });
    return row ? mapLeaveToProfile(row) : null;
  }

  async createLeave(staffId: string, data: CreateStaffLeaveInput): Promise<StaffLeaveProfile> {
    const row = await prisma.staffLeave.create({
      data: {
        staffId,
        type: data.type as LeaveType,
        reason: data.reason ?? null,
        startDate: data.startDate,
        endDate: data.endDate,
      },
    });
    return mapLeaveToProfile(row);
  }

  async updateLeave(id: string, staffId: string, data: UpdateStaffLeaveInput): Promise<StaffLeaveProfile> {
    const row = await prisma.staffLeave.update({
      where: { id },
      data: {
        ...(data.type !== undefined && { type: data.type as LeaveType }),
        ...(data.reason !== undefined && { reason: data.reason }),
        ...(data.startDate !== undefined && { startDate: data.startDate }),
        ...(data.endDate !== undefined && { endDate: data.endDate }),
      },
    });
    return mapLeaveToProfile(row);
  }

  async deleteLeave(id: string, staffId: string): Promise<void> {
    await prisma.staffLeave.deleteMany({ where: { id, staffId } });
  }
}

export const staffRepository = new PrismaStaffRepository();
