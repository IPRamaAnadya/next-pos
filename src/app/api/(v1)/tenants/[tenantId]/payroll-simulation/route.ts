/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { validateTenantAuth } from '@/lib/auth';
import { calculateTakeHomePay } from '@/utils/services/payroll_calculation_service';

type Params = { tenantId: string };

// POST: API untuk simulasi perhitungan take home pay
export async function POST(req: Request, { params }: { params: Params }) {
  try {
    const authResult = validateTenantAuth(req as any, params.tenantId);
    if (!authResult.success) {
      return authResult.response;
    }

    const { tenantId } = params;
    const { 
      staffId, 
      totalHours: manualTotalHours, 
      payrollPeriodId,
      useActualWorkHours = false, 
      bonusAmount = 0, 
      deductionsAmount = 0
    } = await req.json();

    // Panggil service perhitungan
    const simulationResult = await calculateTakeHomePay({
      tenantId,
      staffId,
      payrollPeriodId,
      totalHours: manualTotalHours,
      useActualWorkHours,
      bonusAmount,
      deductionsAmount
    });

    return NextResponse.json({
      meta: { code: 200, status: 'success', message: 'Salary simulation successful' },
      data: simulationResult,
    });
  } catch (error: any) {
    console.error('Error simulating salary:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
