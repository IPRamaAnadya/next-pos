import { StaffShift } from '../../domain/entities/StaffShift';
import { Shift } from '../../domain/entities/Shift';
import { IStaffShiftRepository, StaffShiftCreateData } from '../../domain/repositories/IStaffShiftRepository';
import { IShiftRepository } from '../../domain/repositories/IShiftRepository';
import { ShiftDomainService } from '../../domain/services/ShiftDomainService';
import { StaffShiftQueryOptions } from './interfaces/StaffShiftQueryOptions';

export class StaffShiftUseCases {
  private static instance: StaffShiftUseCases;

  private constructor(
    private staffShiftRepository: IStaffShiftRepository,
    private shiftRepository: IShiftRepository
  ) {}

  public static getInstance(
    staffShiftRepository: IStaffShiftRepository,
    shiftRepository: IShiftRepository
  ): StaffShiftUseCases {
    if (!StaffShiftUseCases.instance) {
      StaffShiftUseCases.instance = new StaffShiftUseCases(staffShiftRepository, shiftRepository);
    }
    return StaffShiftUseCases.instance;
  }

  async getStaffShifts(tenantId: string, options: StaffShiftQueryOptions) {
    return await this.staffShiftRepository.findAll(tenantId, options);
  }

  async getStaffShiftById(id: string, tenantId: string) {
    const staffShift = await this.staffShiftRepository.findById(id, tenantId);
    if (!staffShift) {
      throw new Error('Staff shift not found');
    }
    return staffShift;
  }

  async getStaffShiftsByStaffAndDate(staffId: string, date: Date, tenantId: string) {
    return await this.staffShiftRepository.findByStaffAndDate(staffId, date, tenantId);
  }

  async getStaffShiftsByStaffAndDateRange(staffId: string, startDate: Date, endDate: Date, tenantId: string) {
    return await this.staffShiftRepository.findByStaffAndDateRange(staffId, startDate, endDate, tenantId);
  }

  async getActiveStaffShifts(staffId: string, tenantId: string) {
    return await this.staffShiftRepository.findActiveByStaff(staffId, tenantId);
  }

  async assignStaffToShift(data: StaffShiftCreateData) {
    // Get the shift details
    const shift = await this.shiftRepository.findById(data.shiftId, data.tenantId);
    if (!shift) {
      throw new Error('Shift not found');
    }

    if (!shift.isActive) {
      throw new Error('Cannot assign staff to inactive shift');
    }

    // Create temporary staff shift for validation
    const tempStaffShift = new StaffShift(
      'temp-id',
      data.tenantId,
      data.staffId,
      data.shiftId,
      data.date,
      data.checkInTime,
      data.checkOutTime,
      data.actualBreakDuration,
      data.totalWorkedMinutes,
      data.lateMinutes,
      data.overtimeMinutes,
      data.isCompleted,
      data.notes
    );

    ShiftDomainService.validateStaffShift(tempStaffShift, shift);

    // Check for overlapping shifts on the same date
    const existingShifts = await this.staffShiftRepository.findByStaffAndDate(
      data.staffId,
      data.date,
      data.tenantId
    );

    if (existingShifts.length > 0) {
      // Get all shifts to check for overlaps
      const allShifts = await this.shiftRepository.findActiveShifts(data.tenantId);
      
      if (ShiftDomainService.hasStaffShiftOverlap(existingShifts, tempStaffShift, allShifts)) {
        throw new Error('Staff already has an overlapping shift on this date');
      }
    }

    return await this.staffShiftRepository.create(data);
  }

  async updateStaffShift(id: string, tenantId: string, updates: Partial<StaffShift>) {
    const existingStaffShift = await this.getStaffShiftById(id, tenantId);
    
    // Get shift details if shift-related updates
    let shift: Shift | null = null;
    if (updates.checkInTime || updates.checkOutTime) {
      shift = await this.shiftRepository.findById(existingStaffShift.shiftId, tenantId);
      if (!shift) {
        throw new Error('Shift not found');
      }
    }

    // Validate check-in/check-out logic
    if (updates.checkInTime && existingStaffShift.checkOutTime) {
      throw new Error('Cannot update check-in time after check-out');
    }

    // If updating to completed status, ensure both check-in and check-out times exist
    if (updates.isCompleted && (!existingStaffShift.checkInTime || !existingStaffShift.checkOutTime)) {
      throw new Error('Cannot mark as completed without both check-in and check-out times');
    }

    return await this.staffShiftRepository.update(id, tenantId, updates);
  }

  async deleteStaffShift(id: string, tenantId: string) {
    const staffShift = await this.getStaffShiftById(id, tenantId);
    
    // Business rule: Cannot delete completed shifts (optional)
    if (staffShift.isCompleted) {
      throw new Error('Cannot delete completed staff shift');
    }

    await this.staffShiftRepository.delete(id, tenantId);
  }

  async checkInStaff(id: string, tenantId: string, checkInTime: string) {
    const staffShift = await this.getStaffShiftById(id, tenantId);
    
    if (!staffShift.canCheckIn()) {
      throw new Error('Cannot check in: already checked in or invalid state');
    }

    // Get shift details for validation
    const shift = await this.shiftRepository.findById(staffShift.shiftId, tenantId);
    if (!shift) {
      throw new Error('Shift not found');
    }

    // Calculate late minutes
    const lateMinutes = ShiftDomainService.calculateLateMinutes(shift, checkInTime);
    
    // Update staff shift with check-in time and late minutes
    const updatedStaffShift = await this.staffShiftRepository.checkIn(id, tenantId, checkInTime);
    
    if (lateMinutes > 0) {
      await this.staffShiftRepository.update(id, tenantId, { lateMinutes });
    }

    return updatedStaffShift;
  }

  async checkOutStaff(id: string, tenantId: string, checkOutTime: string, actualBreakDuration?: number) {
    const staffShift = await this.getStaffShiftById(id, tenantId);
    
    if (!staffShift.canCheckOut()) {
      throw new Error('Cannot check out: not checked in or already checked out');
    }

    // Get shift details for calculations
    const shift = await this.shiftRepository.findById(staffShift.shiftId, tenantId);
    if (!shift) {
      throw new Error('Shift not found');
    }

    // Check out the staff
    const updatedStaffShift = await this.staffShiftRepository.checkOut(id, tenantId, checkOutTime, actualBreakDuration);
    
    // Calculate work time details
    const workTime = ShiftDomainService.calculateWorkTime(updatedStaffShift, shift);
    
    // Update with calculated values
    await this.staffShiftRepository.update(id, tenantId, {
      totalWorkedMinutes: workTime.totalMinutes,
      lateMinutes: workTime.lateMinutes,
      overtimeMinutes: workTime.overtimeMinutes,
      isCompleted: true
    });

    return await this.getStaffShiftById(id, tenantId);
  }

  async getStaffShiftsByShift(shiftId: string, tenantId: string, options: StaffShiftQueryOptions) {
    // Verify shift exists
    await this.shiftRepository.findById(shiftId, tenantId);
    return await this.staffShiftRepository.findByShift(shiftId, tenantId, options);
  }

  async getStaffShiftsByDateRange(startDate: Date, endDate: Date, tenantId: string, options?: Partial<StaffShiftQueryOptions>) {
    return await this.staffShiftRepository.findByDateRange(startDate, endDate, tenantId, options);
  }

  async getStaffWorkSummary(staffId: string, startDate: Date, endDate: Date, tenantId: string) {
    const staffShifts = await this.staffShiftRepository.findByStaffAndDateRange(
      staffId, 
      startDate, 
      endDate, 
      tenantId
    );

    const summary = {
      totalShifts: staffShifts.length,
      completedShifts: staffShifts.filter(ss => ss.isCompleted).length,
      totalWorkedHours: 0,
      totalLateMinutes: 0,
      totalOvertimeMinutes: 0,
      averageWorkHours: 0
    };

    for (const staffShift of staffShifts) {
      if (staffShift.totalWorkedMinutes) {
        summary.totalWorkedHours += staffShift.totalWorkedMinutes / 60;
      }
      if (staffShift.lateMinutes) {
        summary.totalLateMinutes += staffShift.lateMinutes;
      }
      if (staffShift.overtimeMinutes) {
        summary.totalOvertimeMinutes += staffShift.overtimeMinutes;
      }
    }

    summary.averageWorkHours = summary.completedShifts > 0 
      ? summary.totalWorkedHours / summary.completedShifts 
      : 0;

    return summary;
  }

  async bulkAssignStaffToShift(assignments: StaffShiftCreateData[]) {
    const results: { success: StaffShift[], failed: { data: StaffShiftCreateData, error: string }[] } = {
      success: [],
      failed: []
    };

    for (const assignment of assignments) {
      try {
        const staffShift = await this.assignStaffToShift(assignment);
        results.success.push(staffShift);
      } catch (error: any) {
        results.failed.push({
          data: assignment,
          error: error.message
        });
      }
    }

    return results;
  }
}