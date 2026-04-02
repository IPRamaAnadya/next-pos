import { Shift } from '../../domain/entities/Shift';
import { PaginatedShifts } from '../../domain/repositories/IShiftRepository';
import { apiResponse } from '@/app/api/utils/response';

export class ShiftResponseDTO {
  static mapToResponse(shift: Shift) {
    return {
      id: shift.id,
      tenant_id: shift.tenantId,
      name: shift.name,
      start_time: shift.startTime,
      end_time: shift.endTime,
      is_active: shift.isActive,
      calculate_before_start_time: shift.calculateBeforeStartTime,
      has_break_time: shift.hasBreakTime,
      break_duration: shift.breakDuration,
      min_working_hours: shift.minWorkingHours,
      max_working_hours: shift.maxWorkingHours,
      overtime_multiplier: shift.overtimeMultiplier,
      late_threshold: shift.lateThreshold,
      early_checkin_allowed: shift.earlyCheckInAllowed,
      color: shift.color,
      description: shift.description,
      
      // Calculated fields
      shift_duration_minutes: shift.getShiftDurationMinutes(),
      effective_working_minutes: shift.getEffectiveWorkingMinutes(),
      effective_working_hours: parseFloat(shift.getEffectiveWorkingHours().toFixed(2)),
      
      created_at: shift.createdAt?.toISOString(),
      updated_at: shift.updatedAt?.toISOString(),
    };
  }

  static mapPaginatedResponse(paginatedShifts: PaginatedShifts) {
    return apiResponse.success({
      data: paginatedShifts.data.map(this.mapToResponse),
      message: 'Shifts retrieved successfully',
      pagination: {
        page: paginatedShifts.pagination.page,
        pageSize: paginatedShifts.pagination.limit,
        total: paginatedShifts.pagination.total,
      },
    });
  }

  static mapSingleResponse(shift: Shift) {
    return apiResponse.success({
      data: this.mapToResponse(shift),
      message: 'Shift retrieved successfully',
    });
  }

  static mapCreatedResponse(shift: Shift) {
    return apiResponse.success({
      data: this.mapToResponse(shift),
      message: 'Shift created successfully',
    });
  }

  static mapUpdatedResponse(shift: Shift) {
    return apiResponse.success({
      data: this.mapToResponse(shift),
      message: 'Shift updated successfully',
    });
  }

  static mapDeletedResponse() {
    return apiResponse.success({
      data: {},
      message: 'Shift deleted successfully',
    });
  }

  static mapActiveToggleResponse(shift: Shift) {
    return apiResponse.success({
      data: this.mapToResponse(shift),
      message: `Shift ${shift.isActive ? 'activated' : 'deactivated'} successfully`,
    });
  }

  static mapMultipleResponse(shifts: Shift[], message: string = 'Shifts processed successfully') {
    return apiResponse.success({
      data: shifts.map(this.mapToResponse),
      message,
    });
  }
}