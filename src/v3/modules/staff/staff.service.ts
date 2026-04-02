import { hashPassword } from '@/v3/lib/bcrypt';
import { staffRepository } from './staff.repository';
import type {
  CreateStaffInput,
  UpdateStaffInput,
  StaffQueryInput,
  UpsertSalaryInput,
  CreateStaffLeaveInput,
  UpdateStaffLeaveInput,
} from './staff.type';

const VALID_ROLES = ['MANAGER', 'CASHIER'];

class StaffService {
  // ── Staff CRUD ────────────────────────────

  async listStaff(tenantId: string, query: StaffQueryInput) {
    const { items, total } = await staffRepository.findAll(tenantId, query);
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 20));
    return {
      items: items.map((e) => e.toProfile(true)),
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
  }

  async getStaff(id: string, tenantId: string) {
    const entity = await staffRepository.findById(id, tenantId);
    if (!entity) throw new Error('Staff not found');
    return entity.toProfile(true);
  }

  async createStaff(tenantId: string, input: CreateStaffInput) {
    if (!input.username?.trim()) throw new Error('Username is required');
    if (!input.password) throw new Error('Password is required');
    if (!input.role) throw new Error('Role is required');

    const role = input.role.toUpperCase();
    if (!VALID_ROLES.includes(role)) {
      throw new Error(`Role must be one of: ${VALID_ROLES.join(', ')}`);
    }

    const existing = await staffRepository.findByUsername(input.username.trim(), tenantId);
    if (existing) throw new Error('Username already taken');

    const hashedPassword = await hashPassword(input.password);
    const entity = await staffRepository.create(tenantId, {
      ...input,
      username: input.username.trim(),
      role,
      hashedPassword,
    });
    return entity.toProfile();
  }

  async updateStaff(id: string, tenantId: string, input: UpdateStaffInput) {
    const existing = await staffRepository.findById(id, tenantId);
    if (!existing) throw new Error('Staff not found');

    if (input.username !== undefined) {
      const dup = await staffRepository.findByUsername(input.username.trim(), tenantId, id);
      if (dup) throw new Error('Username already taken');
      input = { ...input, username: input.username.trim() };
    }

    if (input.role !== undefined) {
      const role = input.role.toUpperCase();
      if (!VALID_ROLES.includes(role)) {
        throw new Error(`Role must be one of: ${VALID_ROLES.join(', ')}`);
      }
      input = { ...input, role };
    }

    let hashedPassword: string | undefined;
    if (input.password) {
      hashedPassword = await hashPassword(input.password);
    }

    const entity = await staffRepository.update(id, tenantId, { ...input, hashedPassword });
    return entity.toProfile(true);
  }

  async deleteStaff(id: string, tenantId: string) {
    const entity = await staffRepository.findById(id, tenantId);
    if (!entity) throw new Error('Staff not found');
    if (entity.isOwnerStaff()) throw new Error('Cannot delete owner staff');
    await staffRepository.delete(id, tenantId);
  }

  // ── Salary ────────────────────────────────

  async getStaffSalary(staffId: string, tenantId: string) {
    const staff = await staffRepository.findById(staffId, tenantId);
    if (!staff) throw new Error('Staff not found');

    const salary = await staffRepository.findSalaryByStaffId(staffId, tenantId);
    return salary ? salary.toProfile() : null;
  }

  async upsertStaffSalary(staffId: string, tenantId: string, input: UpsertSalaryInput) {
    const staff = await staffRepository.findById(staffId, tenantId);
    if (!staff) throw new Error('Staff not found');

    if (input.basicSalary == null || input.basicSalary < 0) {
      throw new Error('basicSalary must be a non-negative number');
    }
    if (input.fixedAllowance !== undefined && input.fixedAllowance < 0) {
      throw new Error('fixedAllowance must be a non-negative number');
    }
    if (input.type !== undefined && !['MONTHLY', 'HOURLY'].includes(input.type)) {
      throw new Error('type must be MONTHLY or HOURLY');
    }

    const entity = await staffRepository.upsertSalary(staffId, tenantId, input);
    return entity.toProfile();
  }

  async deleteStaffSalary(staffId: string, tenantId: string) {
    const staff = await staffRepository.findById(staffId, tenantId);
    if (!staff) throw new Error('Staff not found');

    const salary = await staffRepository.findSalaryByStaffId(staffId, tenantId);
    if (!salary) throw new Error('Salary record not found');

    await staffRepository.deleteSalary(staffId, tenantId);
  }

  // ── StaffLeave ────────────────────────────

  async getStaffLeaves(staffId: string, tenantId: string, type?: string) {
    const staff = await staffRepository.findById(staffId, tenantId);
    if (!staff) throw new Error('Staff not found');
    return staffRepository.findLeavesByStaffId(staffId, type);
  }

  async getStaffLeave(id: string, staffId: string, tenantId: string) {
    const staff = await staffRepository.findById(staffId, tenantId);
    if (!staff) throw new Error('Staff not found');

    const leave = await staffRepository.findLeaveById(id, staffId);
    if (!leave) throw new Error('Leave record not found');
    return leave;
  }

  async createStaffLeave(staffId: string, tenantId: string, input: CreateStaffLeaveInput) {
    const staff = await staffRepository.findById(staffId, tenantId);
    if (!staff) throw new Error('Staff not found');

    if (!input.type) throw new Error('Leave type is required');
    if (!input.startDate || !input.endDate) throw new Error('startDate and endDate are required');
    if (new Date(input.startDate) > new Date(input.endDate)) {
      throw new Error('startDate must be before or equal to endDate');
    }

    return staffRepository.createLeave(staffId, input);
  }

  async updateStaffLeave(id: string, staffId: string, tenantId: string, input: UpdateStaffLeaveInput) {
    const staff = await staffRepository.findById(staffId, tenantId);
    if (!staff) throw new Error('Staff not found');

    const leave = await staffRepository.findLeaveById(id, staffId);
    if (!leave) throw new Error('Leave record not found');

    const startDate = input.startDate ?? leave.startDate;
    const endDate = input.endDate ?? leave.endDate;
    if (new Date(startDate) > new Date(endDate)) {
      throw new Error('startDate must be before or equal to endDate');
    }

    return staffRepository.updateLeave(id, staffId, input);
  }

  async deleteStaffLeave(id: string, staffId: string, tenantId: string) {
    const staff = await staffRepository.findById(staffId, tenantId);
    if (!staff) throw new Error('Staff not found');

    const leave = await staffRepository.findLeaveById(id, staffId);
    if (!leave) throw new Error('Leave record not found');

    await staffRepository.deleteLeave(id, staffId);
  }
}

export const staffService = new StaffService();
