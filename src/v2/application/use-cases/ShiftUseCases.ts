import { Shift } from '../../domain/entities/Shift';
import { IShiftRepository, ShiftCreateData } from '../../domain/repositories/IShiftRepository';
import { ShiftDomainService } from '../../domain/services/ShiftDomainService';
import { ShiftQueryOptions } from './interfaces/ShiftQueryOptions';

export class ShiftUseCases {
  private static instance: ShiftUseCases;

  private constructor(private shiftRepository: IShiftRepository) {}

  public static getInstance(shiftRepository: IShiftRepository): ShiftUseCases {
    if (!ShiftUseCases.instance) {
      ShiftUseCases.instance = new ShiftUseCases(shiftRepository);
    }
    return ShiftUseCases.instance;
  }

  async getShifts(tenantId: string, options: ShiftQueryOptions) {
    return await this.shiftRepository.findAll(tenantId, options);
  }

  async getActiveShifts(tenantId: string) {
    return await this.shiftRepository.findActiveShifts(tenantId);
  }

  async getShiftById(id: string, tenantId: string) {
    const shift = await this.shiftRepository.findById(id, tenantId);
    if (!shift) {
      throw new Error('Shift not found');
    }
    return shift;
  }

  async createShift(data: ShiftCreateData) {
    // Validate shift data
    const tempShift = new Shift(
      'temp-id',
      data.tenantId,
      data.name,
      data.startTime,
      data.endTime,
      data.isActive,
      data.calculateBeforeStartTime,
      data.hasBreakTime,
      data.breakDuration,
      data.minWorkingHours,
      data.maxWorkingHours,
      data.overtimeMultiplier,
      data.lateThreshold,
      data.earlyCheckInAllowed,
      data.color,
      data.description
    );

    ShiftDomainService.validateShift(tempShift);

    // Check for name uniqueness
    const existingShift = await this.shiftRepository.findByName(data.name, data.tenantId);
    if (existingShift) {
      throw new Error('Shift name already exists');
    }

    return await this.shiftRepository.create(data);
  }

  async updateShift(id: string, tenantId: string, updates: Partial<Shift>) {
    const existingShift = await this.getShiftById(id, tenantId);
    
    // Check name uniqueness if name is being updated
    if (updates.name && updates.name !== existingShift.name) {
      const shiftWithSameName = await this.shiftRepository.findByName(updates.name, tenantId);
      if (shiftWithSameName && shiftWithSameName.id !== id) {
        throw new Error('Shift name already exists');
      }
    }

    // Validate updated shift data
    if (updates.startTime || updates.endTime || updates.minWorkingHours || updates.maxWorkingHours || 
        updates.breakDuration !== undefined || updates.hasBreakTime !== undefined) {
      
      const updatedShift = new Shift(
        existingShift.id,
        existingShift.tenantId,
        updates.name ?? existingShift.name,
        updates.startTime ?? existingShift.startTime,
        updates.endTime ?? existingShift.endTime,
        updates.isActive ?? existingShift.isActive,
        updates.calculateBeforeStartTime ?? existingShift.calculateBeforeStartTime,
        updates.hasBreakTime ?? existingShift.hasBreakTime,
        updates.breakDuration ?? existingShift.breakDuration,
        updates.minWorkingHours ?? existingShift.minWorkingHours,
        updates.maxWorkingHours ?? existingShift.maxWorkingHours,
        updates.overtimeMultiplier ?? existingShift.overtimeMultiplier,
        updates.lateThreshold ?? existingShift.lateThreshold,
        updates.earlyCheckInAllowed ?? existingShift.earlyCheckInAllowed,
        updates.color ?? existingShift.color,
        updates.description ?? existingShift.description
      );

      ShiftDomainService.validateShift(updatedShift);
    }

    return await this.shiftRepository.update(id, tenantId, updates);
  }

  async deleteShift(id: string, tenantId: string) {
    await this.getShiftById(id, tenantId); // Ensure exists
    
    // TODO: Check if shift is being used by any staff shifts
    // For now, we'll allow deletion but in production you might want to:
    // 1. Prevent deletion if active staff shifts exist
    // 2. Or soft delete the shift
    
    await this.shiftRepository.delete(id, tenantId);
  }

  async toggleShiftActive(id: string, tenantId: string, isActive: boolean) {
    await this.getShiftById(id, tenantId); // Ensure exists
    return await this.shiftRepository.toggleActive(id, tenantId, isActive);
  }

  async createDefaultShifts(tenantId: string) {
    const defaultShifts = ShiftDomainService.createDefaultShifts(tenantId);
    const createdShifts: Shift[] = [];

    for (const shiftData of defaultShifts) {
      try {
        // Check if shift with same name already exists
        const existing = await this.shiftRepository.findByName(shiftData.name, tenantId);
        if (!existing) {
          const shift = await this.shiftRepository.create(shiftData);
          createdShifts.push(shift);
        }
      } catch (error) {
        console.warn(`Failed to create default shift ${shiftData.name}:`, error);
      }
    }

    return createdShifts;
  }

  async validateShiftTimes(startTime: string, endTime: string) {
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    
    if (!timeRegex.test(startTime)) {
      throw new Error('Invalid start time format. Use HH:mm format');
    }
    
    if (!timeRegex.test(endTime)) {
      throw new Error('Invalid end time format. Use HH:mm format');
    }

    return {
      isOvernight: endTime < startTime,
      duration: this.calculateDuration(startTime, endTime)
    };
  }

  private calculateDuration(startTime: string, endTime: string): number {
    const parseTime = (time: string) => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
    };

    const start = parseTime(startTime);
    const end = parseTime(endTime);
    
    if (end < start) {
      return (24 * 60) - start + end;
    }
    
    return end - start;
  }
}