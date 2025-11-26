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

    // 1. Ensure expense category 'Gaji' exists (isPrivate: true)
    let gajiCategory = await prisma.expenseCategory.findFirst({
      where: {
        tenantId: tenantId,
        name: 'Gaji',
      },
    });
    if (!gajiCategory) {
      // Generate a code for the category, e.g., 'GAJI-001' (or just 'GAJI')
      gajiCategory = await prisma.expenseCategory.create({
        data: {
          tenantId: tenantId,
          name: 'Gaji',
          code: 'GAJI',
          isPrivate: true,
        },
      });
    }

    // 2. Get all payroll details for this period
    const payrollDetails = await prisma.payrollDetail.findMany({
      where: {
        payrollPeriodId: payrollPeriodId,
        tenantId: tenantId,
      },
      include: {
        staff: true,
      },
    });

    // 3. Insert expense for each staff's take home pay
    // Import Decimal for safe comparison
    const { Decimal } = await import('@prisma/client/runtime/library');
    const expensePromises = payrollDetails.map(detail => {
      if (!detail.takeHomePay || new Decimal(detail.takeHomePay).lte(0)) return null;
      return prisma.expense.create({
        data: {
          tenantId: tenantId,
          staffId: detail.staffId,
          expenseCategoryId: gajiCategory.id,
          amount: detail.takeHomePay,
          description: `Gaji - ${detail.staff?.username || detail.staffId}`,
          isShow: false,
          paymentType: 'Cash',
          paidAt: new Date(),
        },
      });
    });
    await Promise.all(expensePromises.filter(Boolean));

    // 4. Finalize payroll period (set finalized to true)
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