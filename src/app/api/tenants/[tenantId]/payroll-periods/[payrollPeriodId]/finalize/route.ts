import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  req: NextRequest,
  { params }: { params: { tenantId: string; payrollPeriodId: string } }
) {
  const { tenantId, payrollPeriodId } = await params;

  if (!tenantId || !payrollPeriodId) {
    return NextResponse.json(
      { error: 'Missing tenantId or payrollPeriodId' },
      { status: 400 }
    );
  }

  try {
    // Get payroll period from Prisma
    const payrollPeriod = await prisma.payrollPeriod.findUnique({
      where: {
      id: payrollPeriodId,
      tenantId: tenantId,
      },
    });

    if (!payrollPeriod) {
      return NextResponse.json(
      { error: 'Payroll period not found' },
      { status: 404 }
      );
    }

    // Finalize payroll period (example: set finalized to true)
    const result = await prisma.payrollPeriod.update({
      where: {
      id: payrollPeriodId,
      tenantId: tenantId,
      },
      data: {
      isFinalized: true,
      },
    });
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to finalize payroll period' },
      { status: 500 }
    );
  }
}