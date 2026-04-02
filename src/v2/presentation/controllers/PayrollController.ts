import { NextRequest } from 'next/server';
import { PayrollUseCases } from '../../application/usecases/PayrollUseCases';
import { PayrollServiceContainer } from '../../application/services/PayrollServiceContainer';
import { apiResponse } from '@/app/api/utils/response';

export class PayrollController {
  private payrollUseCases: PayrollUseCases;

  constructor() {
    this.payrollUseCases = PayrollServiceContainer.getPayrollUseCases();
  }

  // ==================== PAYROLL PERIOD OPERATIONS ====================

  async createPayrollPeriod(req: NextRequest, tenantId: string) {
    try {
      const body = await req.json();
      const { period_start, period_end } = body;

      if (!period_start || !period_end) {
        return apiResponse.validationError([
          { field: 'period_start', message: 'Period start date is required' },
          { field: 'period_end', message: 'Period end date is required' }
        ]);
      }

      const periodStart = new Date(period_start);
      const periodEnd = new Date(period_end);

      if (isNaN(periodStart.getTime()) || isNaN(periodEnd.getTime())) {
        return apiResponse.validationError([
          { field: 'dates', message: 'Invalid date format' }
        ]);
      }

      const period = await this.payrollUseCases.createPayrollPeriod({
        tenantId,
        periodStart,
        periodEnd
      });

      return apiResponse.success({
        message: 'Payroll period created successfully',
        data: this.mapPayrollPeriodToResponse(period)
      });
    } catch (error) {
      console.error('Error creating payroll period:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('overlap')) {
          return apiResponse.validationError([
            { field: 'period', message: error.message }
          ]);
        }
        return apiResponse.validationError([
          { field: 'general', message: error.message }
        ]);
      }
      
      return apiResponse.internalError();
    }
  }

  async getPayrollPeriods(tenantId: string, includeFinalized: boolean = true) {
    try {
      const periods = await this.payrollUseCases.getPayrollPeriodsByTenant(tenantId, includeFinalized);

      return apiResponse.success({
        message: 'Payroll periods retrieved successfully',
        data: periods.map(period => this.mapPayrollPeriodToResponse(period))
      });
    } catch (error) {
      console.error('Error getting payroll periods:', error);
      return apiResponse.internalError();
    }
  }

  async getPayrollPeriod(tenantId: string, periodId: string) {
    try {
      const period = await this.payrollUseCases.getPayrollPeriod(periodId);

      if (!period) {
        return apiResponse.notFound('Payroll period not found');
      }

      return apiResponse.success({
        message: 'Payroll period retrieved successfully',
        data: this.mapPayrollPeriodToResponse(period)
      });
    } catch (error) {
      console.error('Error getting payroll period:', error);
      return apiResponse.internalError();
    }
  }

  async updatePayrollPeriod(req: NextRequest, tenantId: string, periodId: string) {
    try {
      const body = await req.json();
      const updates = {
        periodStart: body.period_start ? new Date(body.period_start) : undefined,
        periodEnd: body.period_end ? new Date(body.period_end) : undefined
      };

      const period = await this.payrollUseCases.updatePayrollPeriod(periodId, updates);

      return apiResponse.success({
        message: 'Payroll period updated successfully',
        data: this.mapPayrollPeriodToResponse(period)
      });
    } catch (error) {
      console.error('Error updating payroll period:', error);
      return apiResponse.internalError();
    }
  }

  async deletePayrollPeriod(tenantId: string, periodId: string) {
    try {
      await this.payrollUseCases.deletePayrollPeriod(periodId);

      return apiResponse.success({
        message: 'Payroll period deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting payroll period:', error);
      return apiResponse.internalError();
    }
  }

  async finalizePayrollPeriod(tenantId: string, periodId: string) {
    try {
      const period = await this.payrollUseCases.finalizePayrollPeriod(periodId);

      return apiResponse.success({
        message: 'Payroll period finalized successfully',
        data: this.mapPayrollPeriodToResponse(period)
      });
    } catch (error) {
      console.error('Error finalizing payroll period:', error);
      return apiResponse.internalError();
    }
  }

  // ==================== PAYROLL CALCULATION OPERATIONS ====================

  async calculatePayrollPeriod(req: NextRequest, tenantId: string, periodId: string) {
    try {
      const body = await req.json();
      const { staff_id, use_actual_work_hours = true } = body;

      const result = await this.payrollUseCases.calculatePayrollForStaff({
        tenantId,
        payrollPeriodId: periodId,
        staffId: staff_id,
        useActualWorkHours: use_actual_work_hours
      });

      return apiResponse.success({
        message: 'Payroll calculated successfully',
        data: this.mapPayrollDetailToResponse(result)
      });
    } catch (error) {
      console.error('Error calculating payroll:', error);
      return apiResponse.internalError();
    }
  }

  async bulkCalculatePayroll(req: NextRequest, tenantId: string, periodId: string) {
    try {
      const body = await req.json();
      const { staff_ids, use_actual_work_hours = true } = body;

      const results = await this.payrollUseCases.bulkCalculatePayroll({
        tenantId,
        payrollPeriodId: periodId,
        staffIds: staff_ids,
        useActualWorkHours: use_actual_work_hours
      });

      return apiResponse.success({
        message: 'Bulk payroll calculation completed',
        data: results.map(result => this.mapPayrollDetailToResponse(result))
      });
    } catch (error) {
      console.error('Error in bulk payroll calculation:', error);
      return apiResponse.internalError();
    }
  }

  async getPayrollSummary(tenantId: string, periodId: string) {
    try {
      const summary = await this.payrollUseCases.getPayrollSummary({
        tenantId,
        periodId
      });

      return apiResponse.success({
        message: 'Payroll summary generated successfully',
        data: summary
      });
    } catch (error) {
      console.error('Error generating payroll summary:', error);
      return apiResponse.internalError();
    }
  }

  // ==================== PAYROLL DETAIL OPERATIONS ====================

  async getPayrollDetails(tenantId: string, periodId: string, employeeId?: string | null) {
    try {
      let details;
      if (employeeId) {
        const detail = await this.payrollUseCases.findByPeriodAndStaff(periodId, employeeId, tenantId);
        details = detail ? [detail] : [];
      } else {
        details = await this.payrollUseCases.getPayrollDetailsByPeriod(periodId);
      }

      return apiResponse.success({
        message: 'Payroll details retrieved successfully',
        data: details.map(detail => this.mapPayrollDetailToResponse(detail))
      });
    } catch (error) {
      console.error('Error getting payroll details:', error);
      return apiResponse.internalError();
    }
  }

  async getPayrollDetail(tenantId: string, periodId: string, detailId: string) {
    try {
      const detail = await this.payrollUseCases.getPayrollDetail(detailId);

      if (!detail) {
        return apiResponse.notFound('Payroll detail not found');
      }

      return apiResponse.success({
        message: 'Payroll detail retrieved successfully',
        data: this.mapPayrollDetailToResponse(detail)
      });
    } catch (error) {
      console.error('Error getting payroll detail:', error);
      return apiResponse.internalError();
    }
  }

  async createPayrollDetail(req: NextRequest, tenantId: string, periodId: string) {
    try {
      const body = await req.json();
      const { staff_id, bonus_amount, deductions_amount, manual_overtime_hours } = body;

      const detail = await this.payrollUseCases.calculatePayrollForStaff({
        tenantId,
        payrollPeriodId: periodId,
        staffId: staff_id,
        bonusAmount: bonus_amount,
        deductionsAmount: deductions_amount,
        manualOvertimeHours: manual_overtime_hours
      });

      return apiResponse.success({
        message: 'Payroll detail created successfully',
        data: this.mapPayrollDetailToResponse(detail)
      });
    } catch (error) {
      console.error('Error creating payroll detail:', error);
      return apiResponse.internalError();
    }
  }

  async updatePayrollDetail(req: NextRequest, tenantId: string, periodId: string, detailId: string) {
    try {
      const body = await req.json();
      const { bonus_amount, deductions_amount, manual_overtime_hours } = body;

      const updateData: any = {};
      if (bonus_amount !== undefined) updateData.bonusAmount = bonus_amount;
      if (deductions_amount !== undefined) updateData.deductionsAmount = deductions_amount;
      if (manual_overtime_hours !== undefined) updateData.manualOvertimeHours = manual_overtime_hours;

      const detail = await this.payrollUseCases.updatePayrollDetail(detailId, updateData);

      return apiResponse.success({
        message: 'Payroll detail updated successfully',
        data: this.mapPayrollDetailToResponse(detail)
      });
    } catch (error) {
      console.error('Error updating payroll detail:', error);
      return apiResponse.internalError();
    }
  }

  async deletePayrollDetail(tenantId: string, periodId: string, detailId: string) {
    try {
      // Note: This would need a delete method in PayrollUseCases
      return apiResponse.success({
        message: 'Delete operation not fully implemented - would need PayrollUseCases.deletePayrollDetail method'
      });
    } catch (error) {
      console.error('Error deleting payroll detail:', error);
      return apiResponse.internalError();
    }
  }

  async markPayrollDetailAsPaid(tenantId: string, periodId: string, detailId: string) {
    try {
      const detail = await this.payrollUseCases.markPayrollAsPaid(detailId);

      return apiResponse.success({
        message: 'Payroll detail marked as paid',
        data: this.mapPayrollDetailToResponse(detail)
      });
    } catch (error) {
      console.error('Error marking payroll detail as paid:', error);
      return apiResponse.internalError();
    }
  }

  // ==================== BULK OPERATIONS ====================

  async bulkCreatePayrollDetails(req: NextRequest, tenantId: string, periodId: string) {
    try {
      const body = await req.json();
      const { staff_ids, use_actual_work_hours = true } = body;

      const results = await this.payrollUseCases.bulkCalculatePayroll({
        tenantId,
        payrollPeriodId: periodId,
        staffIds: staff_ids,
        useActualWorkHours: use_actual_work_hours
      });

      return apiResponse.success({
        message: 'Payroll details created successfully',
        data: results.map(detail => this.mapPayrollDetailToResponse(detail))
      });
    } catch (error) {
      console.error('Error creating bulk payroll details:', error);
      return apiResponse.internalError();
    }
  }

  async bulkUpdatePayrollDetails(req: NextRequest, tenantId: string, periodId: string) {
    try {
      const body = await req.json();
      const { updates } = body;

      const results = [];
      for (const update of updates) {
        const detail = await this.payrollUseCases.updatePayrollDetail(update.id, update.data);
        results.push(detail);
      }

      return apiResponse.success({
        message: 'Payroll details updated successfully',
        data: results.map(detail => this.mapPayrollDetailToResponse(detail))
      });
    } catch (error) {
      console.error('Error updating bulk payroll details:', error);
      return apiResponse.internalError();
    }
  }

  async bulkMarkPayrollDetailsAsPaid(req: NextRequest, tenantId: string, periodId: string) {
    try {
      const body = await req.json();
      const { detail_ids } = body;

      const updatedDetails = await this.payrollUseCases.bulkMarkPayrollAsPaid(detail_ids);

      return apiResponse.success({
        message: 'Payroll details marked as paid',
        data: updatedDetails.map(detail => this.mapPayrollDetailToResponse(detail))
      });
    } catch (error) {
      console.error('Error marking bulk payroll details as paid:', error);
      return apiResponse.internalError();
    }
  }

  // ==================== SETTINGS OPERATIONS ====================

  async getPayrollSettings(tenantId: string) {
    try {
      // Note: These would need to be implemented in PayrollUseCases
      return apiResponse.success({
        message: 'Settings operations not fully implemented yet',
        data: []
      });
    } catch (error) {
      console.error('Error getting payroll settings:', error);
      return apiResponse.internalError();
    }
  }

  async createPayrollSetting(req: NextRequest, tenantId: string) {
    try {
      return apiResponse.success({
        message: 'Settings operations not fully implemented yet'
      });
    } catch (error) {
      console.error('Error creating payroll setting:', error);
      return apiResponse.internalError();
    }
  }

  async getPayrollSetting(tenantId: string, settingId: string) {
    try {
      return apiResponse.success({
        message: 'Settings operations not fully implemented yet'
      });
    } catch (error) {
      console.error('Error getting payroll setting:', error);
      return apiResponse.internalError();
    }
  }

  async updatePayrollSetting(req: NextRequest, tenantId: string, settingId: string) {
    try {
      return apiResponse.success({
        message: 'Settings operations not fully implemented yet'
      });
    } catch (error) {
      console.error('Error updating payroll setting:', error);
      return apiResponse.internalError();
    }
  }

  async deletePayrollSetting(tenantId: string, settingId: string) {
    try {
      return apiResponse.success({
        message: 'Settings operations not fully implemented yet'
      });
    } catch (error) {
      console.error('Error deleting payroll setting:', error);
      return apiResponse.internalError();
    }
  }

  // ==================== REPORTING OPERATIONS ====================

  async getPayrollReports(tenantId: string, startDate?: string | null, endDate?: string | null, employeeId?: string | null) {
    try {
      const filters: any = { tenantId };
      if (startDate) filters.startDate = new Date(startDate);
      if (endDate) filters.endDate = new Date(endDate);

      const reports = await this.payrollUseCases.getPayrollSummary(filters);

      return apiResponse.success({
        message: 'Payroll reports generated successfully',
        data: reports
      });
    } catch (error) {
      console.error('Error generating payroll reports:', error);
      return apiResponse.internalError();
    }
  }

  // ==================== RESPONSE MAPPERS ====================

  private mapPayrollPeriodToResponse(period: any) {
    return {
      id: period.id,
      tenant_id: period.tenantId,
      period_start: period.periodStart.toISOString().split('T')[0],
      period_end: period.periodEnd.toISOString().split('T')[0],
      is_finalized: period.isFinalized,
      is_active: period.isActive(),
      duration_days: period.getDurationInDays(),
      working_days: period.getWorkingDaysCount(),
      can_be_finalized: period.canBeFinalized(),
      can_be_modified: period.canBeModified(),
      created_at: period.createdAt,
      updated_at: period.updatedAt
    };
  }

  private mapPayrollDetailToResponse(detail: any) {
    return {
      id: detail.id,
      tenant_id: detail.tenantId,
      payroll_period_id: detail.payrollPeriodId,
      staff_id: detail.staffId,
      basic_salary_amount: detail.basicSalaryAmount,
      fixed_allowance_amount: detail.fixedAllowanceAmount,
      overtime_hours: detail.overtimeHours,
      overtime_pay: detail.overtimePay,
      bonus_amount: detail.bonusAmount,
      deductions_amount: detail.deductionsAmount,
      gross_pay: detail.getGrossPay(),
      take_home_pay: detail.takeHomePay,
      is_paid: detail.isPaid,
      paid_at: detail.paidAt,
      can_be_paid: detail.canBePaid(),
      can_be_modified: detail.canBeModified(),
      has_overtime: detail.hasOvertime(),
      has_bonus: detail.hasBonus(),
      has_deductions: detail.hasDeductions(),
      created_at: detail.createdAt,
      updated_at: detail.updatedAt
    };
  }
}