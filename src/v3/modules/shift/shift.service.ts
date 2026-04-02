import { shiftRepository } from './shift.repository';
import type { CreateShiftInput, ShiftQueryInput, UpdateShiftInput } from './shift.type';

const TIME_REGEX = /^\d{2}:\d{2}$/;

class ShiftService {
  async listShifts(tenantId: string, query: ShiftQueryInput) {
    const { items, total } = await shiftRepository.findAll(tenantId, query);
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 20));
    return {
      items: items.map((e) => e.toProfile()),
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
  }

  async listActiveShifts(tenantId: string) {
    const items = await shiftRepository.findActive(tenantId);
    return items.map((e) => e.toProfile());
  }

  async getShift(id: string, tenantId: string) {
    const entity = await shiftRepository.findById(id, tenantId);
    if (!entity) throw new Error('Shift not found');
    return entity.toProfile();
  }

  async createShift(tenantId: string, input: CreateShiftInput) {
    if (!input.name?.trim()) throw new Error('Shift name is required');
    if (!input.startTime) throw new Error('startTime is required');
    if (!input.endTime) throw new Error('endTime is required');
    if (!TIME_REGEX.test(input.startTime)) throw new Error('startTime must be in HH:mm format');
    if (!TIME_REGEX.test(input.endTime)) throw new Error('endTime must be in HH:mm format');

    const existing = await shiftRepository.findByName(input.name.trim(), tenantId);
    if (existing) throw new Error('A shift with this name already exists');

    const entity = await shiftRepository.create(tenantId, { ...input, name: input.name.trim() });
    return entity.toProfile();
  }

  async updateShift(id: string, tenantId: string, input: UpdateShiftInput) {
    const existing = await shiftRepository.findById(id, tenantId);
    if (!existing) throw new Error('Shift not found');

    if (input.startTime !== undefined && !TIME_REGEX.test(input.startTime)) {
      throw new Error('startTime must be in HH:mm format');
    }
    if (input.endTime !== undefined && !TIME_REGEX.test(input.endTime)) {
      throw new Error('endTime must be in HH:mm format');
    }
    if (input.name !== undefined) {
      input = { ...input, name: input.name.trim() };
      const dup = await shiftRepository.findByName(input.name!, tenantId, id);
      if (dup) throw new Error('A shift with this name already exists');
    }

    const entity = await shiftRepository.update(id, tenantId, input);
    return entity.toProfile();
  }

  async deleteShift(id: string, tenantId: string) {
    const existing = await shiftRepository.findById(id, tenantId);
    if (!existing) throw new Error('Shift not found');
    await shiftRepository.delete(id, tenantId);
  }
}

export const shiftService = new ShiftService();
