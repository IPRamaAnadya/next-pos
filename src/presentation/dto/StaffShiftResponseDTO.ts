import { StaffShift } from '../../domain/entities/StaffShift';
import { PaginatedStaffShifts } from '../../domain/repositories/IStaffShiftRepository';
import { apiResponse } from '@/app/api/utils/response';

export class StaffShiftResponseDTO {
  static mapToResponse(staffShift: StaffShift) {
    return {
      id: staffShift.id,
      tenant_id: staffShift.tenantId,
      staff_id: staffShift.staffId,
      shift_id: staffShift.shiftId,
      date: staffShift.date.toISOString().split('T')[0], // YYYY-MM-DD format
      check_in_time: staffShift.checkInTime,
      check_out_time: staffShift.checkOutTime,
      actual_break_duration: staffShift.actualBreakDuration,
      total_worked_minutes: staffShift.totalWorkedMinutes,
      late_minutes: staffShift.lateMinutes,
      overtime_minutes: staffShift.overtimeMinutes,
      is_completed: staffShift.isCompleted,
      notes: staffShift.notes,
      
      // Status fields
      has_checked_in: staffShift.hasCheckedIn(),
      has_checked_out: staffShift.hasCheckedOut(),
      is_active: staffShift.isActive(),
      can_check_in: staffShift.canCheckIn(),
      can_check_out: staffShift.canCheckOut(),
      
      // Calculated fields
      worked_minutes: staffShift.calculateWorkedMinutes(),
      worked_hours: parseFloat(staffShift.calculateWorkedHours().toFixed(2)),
      effective_worked_minutes: staffShift.calculateEffectiveWorkedMinutes(),
      effective_worked_hours: parseFloat(staffShift.calculateEffectiveWorkedHours().toFixed(2)),
      
      created_at: staffShift.createdAt?.toISOString(),
      updated_at: staffShift.updatedAt?.toISOString(),

      shift: staffShift.shift,
      staff: staffShift.staff
    };
  }

  static mapPaginatedResponse(paginatedStaffShifts: PaginatedStaffShifts) {
    return apiResponse.success({
      data: paginatedStaffShifts.data.map(this.mapToResponse),
      message: 'Staff shifts retrieved successfully',
      pagination: {
        page: paginatedStaffShifts.pagination.page,
        pageSize: paginatedStaffShifts.pagination.limit,
        total: paginatedStaffShifts.pagination.total,
      },
    });
  }

  static mapSingleResponse(staffShift: StaffShift) {
    return apiResponse.success({
      data: this.mapToResponse(staffShift),
      message: 'Staff shift retrieved successfully',
    });
  }

  static mapCreatedResponse(staffShift: StaffShift) {
    return apiResponse.success({
      data: this.mapToResponse(staffShift),
      message: 'Staff shift assigned successfully',
    });
  }

  static mapUpdatedResponse(staffShift: StaffShift) {
    return apiResponse.success({
      data: this.mapToResponse(staffShift),
      message: 'Staff shift updated successfully',
    });
  }

  static mapDeletedResponse() {
    return apiResponse.success({
      data: {},
      message: 'Staff shift deleted successfully',
    });
  }

  static mapCheckInResponse(staffShift: StaffShift) {
    return apiResponse.success({
      data: this.mapToResponse(staffShift),
      message: 'Staff checked in successfully',
    });
  }

  static mapCheckOutResponse(staffShift: StaffShift) {
    return apiResponse.success({
      data: this.mapToResponse(staffShift),
      message: 'Staff checked out successfully',
    });
  }

  static mapMultipleResponse(staffShifts: StaffShift[], message: string = 'Staff shifts processed successfully') {
    return apiResponse.success({
      data: staffShifts.map(this.mapToResponse),
      message,
    });
  }

  static mapBulkAssignResponse(results: { success: StaffShift[], failed: { data: any, error: string }[] }) {
    return apiResponse.success({
      data: {
        success: results.success.map(this.mapToResponse),
        failed: results.failed,
        summary: {
          total: results.success.length + results.failed.length,
          successful: results.success.length,
          failed: results.failed.length
        }
      },
      message: `Bulk assignment completed: ${results.success.length} successful, ${results.failed.length} failed`,
    });
  }

  static mapWorkSummaryResponse(summary: any) {
    return apiResponse.success({
      data: {
        total_shifts: summary.totalShifts,
        completed_shifts: summary.completedShifts,
        total_worked_hours: parseFloat(summary.totalWorkedHours.toFixed(2)),
        total_late_minutes: summary.totalLateMinutes,
        total_overtime_minutes: summary.totalOvertimeMinutes,
        average_work_hours: parseFloat(summary.averageWorkHours.toFixed(2)),
      },
      message: 'Staff work summary retrieved successfully',
    });
  }
}