import { Staff } from '../../domain/entities/Staff';
import { Salary } from '../../domain/entities/Salary';
import { Attendance } from '../../domain/entities/Attendance';
import { PayrollDetail } from '../../domain/entities/PayrollDetail';
import { 
  StaffResponseDTO, 
  StaffListResponseDTO, 
  SalaryResponseDTO, 
  AttendanceResponseDTO, 
  PayrollDetailResponseDTO, 
  StaffDeleteResponseDTO 
} from '../dto/StaffResponseDTO';

export class StaffMapper {
  static toStaffResponseDTO(staff: Staff): StaffResponseDTO {
    return {
      id: staff.id,
      tenant_id: staff.tenantId,
      is_owner: staff.isOwner,
      role: staff.role,
      username: staff.username,
      created_at: staff.createdAt.toISOString(),
      updated_at: staff.updatedAt.toISOString(),
    };
  }

  static toStaffListResponseDTO(
    staffs: Staff[],
    total: number,
    page: number,
    limit: number
  ): StaffListResponseDTO {
    return {
      data: staffs.map(staff => this.toStaffResponseDTO(staff)),
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit),
    };
  }

  static toSalaryResponseDTO(salary: Salary): SalaryResponseDTO {
    return {
      id: salary.id,
      tenant_id: salary.tenantId,
      staff_id: salary.staffId,
      basic_salary: salary.basicSalary,
      fixed_allowance: salary.fixedAllowance,
      type: salary.type,
      total_salary: salary.getTotalSalary(),
      hourly_rate: salary.getHourlyRate(),
      created_at: salary.createdAt.toISOString(),
      updated_at: salary.updatedAt.toISOString(),
    };
  }

  static toAttendanceResponseDTO(attendance: Attendance): AttendanceResponseDTO {
    return {
      id: attendance.id,
      tenant_id: attendance.tenantId,
      staff_id: attendance.staffId,
      date: attendance.date.toISOString().split('T')[0], // YYYY-MM-DD format
      check_in_time: attendance.checkInTime,
      check_out_time: attendance.checkOutTime,
      total_hours: attendance.totalHours,
      is_weekend: attendance.isWeekend,
      is_complete: attendance.isComplete(),
      created_at: attendance.createdAt.toISOString(),
      updated_at: attendance.updatedAt.toISOString(),
    };
  }

  static toPayrollDetailResponseDTO(payrollDetail: PayrollDetail): PayrollDetailResponseDTO {
    return {
      id: payrollDetail.id,
      tenant_id: payrollDetail.tenantId,
      payroll_period_id: payrollDetail.payrollPeriodId,
      staff_id: payrollDetail.staffId,
      basic_salary_amount: payrollDetail.basicSalaryAmount,
      fixed_allowance_amount: payrollDetail.fixedAllowanceAmount,
      overtime_hours: payrollDetail.overtimeHours,
      overtime_pay: payrollDetail.overtimePay,
      bonus_amount: payrollDetail.bonusAmount,
      deductions_amount: payrollDetail.deductionsAmount,
      gross_pay: payrollDetail.getGrossPay(),
      take_home_pay: payrollDetail.takeHomePay,
      is_paid: payrollDetail.isPaid,
      paid_at: payrollDetail.paidAt?.toISOString() || null,
      created_at: payrollDetail.createdAt.toISOString(),
      updated_at: payrollDetail.updatedAt.toISOString(),
    };
  }

  static toDeleteResponseDTO(success: boolean, message: string): StaffDeleteResponseDTO {
    return {
      success,
      message,
    };
  }

  static toDomainFromCreateRequest(tenantId: string, data: { username: string; role: string; is_owner?: boolean }): { tenantId: string; username: string; role: string; isOwner: boolean } {
    return {
      tenantId,
      username: data.username,
      role: data.role,
      isOwner: data.is_owner || false,
    };
  }
}