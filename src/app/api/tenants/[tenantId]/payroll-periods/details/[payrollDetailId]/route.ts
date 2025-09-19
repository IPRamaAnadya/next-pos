import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { validateTenantAuth } from '@/lib/auth';
import { Decimal } from '@prisma/client/runtime/library';
import { calculateTakeHomePay } from '@/utils/services/payroll_calculation_service';

// PUT: Update payroll detail by ID (bonus/deductions)
export async function PUT(req: Request, { params }: { params: { tenantId: string, payrollDetailId: string } }) {
  try {
    const authResult = validateTenantAuth(req as any, params.tenantId);
    if (!authResult.success) {
      return authResult.response;
    }
    const { tenantId, payrollDetailId } = params;
    const { bonusAmount = 0, deductionsAmount = 0 } = await req.json();

    // Fetch detail to get staffId and payrollPeriodId
    const detail = await prisma.payrollDetail.findUnique({ where: { id: payrollDetailId, tenantId } });
    if (!detail) {
      return NextResponse.json({
        meta: { code: 404, status: 'error', message: 'Payroll detail not found' },
      }, { status: 404 });
    }

    // Recalculate all payroll fields
    const payrollFields = await calculateTakeHomePay({
      tenantId,
      staffId: detail.staffId,
      payrollPeriodId: detail.payrollPeriodId,
      bonusAmount,
      deductionsAmount,
      useActualWorkHours: true,
    });

    const updatedDetail = await prisma.payrollDetail.update({
      where: { id: payrollDetailId },
      data: {
        basicSalaryAmount: new Decimal(payrollFields.basicSalary),
        fixedAllowanceAmount: new Decimal(payrollFields.fixedAllowance),
        overtimeHours: new Decimal(payrollFields.overtimeHours),
        overtimePay: new Decimal(payrollFields.overtimePay),
        bonusAmount: new Decimal(payrollFields.bonusAmount),
        deductionsAmount: new Decimal(payrollFields.deductionsAmount),
        takeHomePay: new Decimal(payrollFields.takeHomePay),
      },
    });
    return NextResponse.json({
      meta: { code: 200, status: 'success', message: 'Payroll detail updated and recalculated successfully' },
      data: updatedDetail,
    });
  } catch (error: any) {
    console.error('Error updating payroll detail:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
