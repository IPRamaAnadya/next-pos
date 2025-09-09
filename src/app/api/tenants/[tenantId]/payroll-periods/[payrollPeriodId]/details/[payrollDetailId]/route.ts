/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { validateTenantAuth } from '@/lib/auth';

type Params = { tenantId: string; payrollDetailId: string };

// PUT: Memperbarui bonus dan deduksi
export async function PUT(req: Request, { params }: { params: Params }) {
  try {
    const authResult = validateTenantAuth(req as any, params.tenantId);
    if (!authResult.success) {
      return authResult.response;
    }

    const { payrollDetailId } = params;
    const { bonusAmount, deductionsAmount } = await req.json();

    const payrollDetail = await prisma.payrollDetail.findUnique({
      where: { id: payrollDetailId },
    });

    if (!payrollDetail) {
      return NextResponse.json({
        meta: { code: 404, status: 'error', message: 'Payroll detail not found' },
        data: null,
      }, { status: 404 });
    }
    
    // Perbarui nominal bonus dan deduksi
    const updatedDetail = await prisma.payrollDetail.update({
      where: { id: payrollDetailId },
      data: {
        bonusAmount,
        deductionsAmount,
        // Hitung ulang take home pay
        takeHomePay: payrollDetail.basicSalaryAmount.toNumber() +
          payrollDetail.fixedAllowanceAmount.toNumber() +
          payrollDetail.overtimePay.toNumber() +
          (bonusAmount || 0) -
          (deductionsAmount || 0),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      meta: { code: 200, status: 'success', message: 'Payroll detail updated successfully' },
      data: updatedDetail,
    });
  } catch (error) {
    console.error('Error updating payroll detail:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
