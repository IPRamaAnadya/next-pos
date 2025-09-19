/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { validateTenantAuth } from '@/lib/auth';
import { Decimal } from '@prisma/client/runtime/library';
import { calculateTakeHomePay } from '@/utils/services/payroll_calculation_service';

type Params = { tenantId: string; payrollPeriodId: string };

// POST: Membuat atau memperbarui detail penggajian
export async function POST(req: Request, { params }: { params: Params }) {
  try {
    const authResult = validateTenantAuth(req as any, params.tenantId);
    if (!authResult.success) {
      return authResult.response;
    }

    const { tenantId, payrollPeriodId } = params;
    const { staffId, bonusAmount = 0, deductionsAmount = 0 } = await req.json();

    // Pastikan staffId dan payrollPeriodId valid
    const staff = await prisma.staff.findUnique({ where: { id: staffId } });
    if (!staff) {
      return NextResponse.json({
        meta: { code: 404, status: 'error', message: 'Staff not found' },
      }, { status: 404 });
    }

    const payrollPeriod = await prisma.payrollPeriod.findUnique({ where: { id: payrollPeriodId } });
    if (!payrollPeriod) {
      return NextResponse.json({
        meta: { code: 404, status: 'error', message: 'Payroll period not found' },
      }, { status: 404 });
    }

    // Panggil service perhitungan untuk mendapatkan semua detail gaji
    const payrollDetails = await calculateTakeHomePay({
      tenantId,
      staffId,
      payrollPeriodId,
      useActualWorkHours: true,
      bonusAmount,
      deductionsAmount,
    });

    // Periksa apakah detail sudah ada
    const existingDetail = await prisma.payrollDetail.findFirst({
      where: {
        tenantId,
        payrollPeriodId,
        staffId,
      },
    });

    if (existingDetail) {
      // Jika sudah ada, update
      const updatedDetail = await prisma.payrollDetail.update({
        where: {
          id: existingDetail.id,
        },
        data: {
          basicSalaryAmount: new Decimal(payrollDetails.basicSalary),
          fixedAllowanceAmount: new Decimal(payrollDetails.fixedAllowance),
          overtimeHours: new Decimal(payrollDetails.overtimeHours),
          overtimePay: new Decimal(payrollDetails.overtimePay),
          bonusAmount: new Decimal(payrollDetails.bonusAmount),
          deductionsAmount: new Decimal(payrollDetails.deductionsAmount),
          takeHomePay: new Decimal(payrollDetails.takeHomePay),
        },
      });
      return NextResponse.json({
        meta: { code: 200, status: 'success', message: 'Payroll details updated successfully' },
        data: updatedDetail,
      });
    } else {
      // Jika belum ada, buat baru
      const newDetail = await prisma.payrollDetail.create({
        data: {
          tenantId,
          payrollPeriodId,
          staffId,
          basicSalaryAmount: new Decimal(payrollDetails.basicSalary),
          fixedAllowanceAmount: new Decimal(payrollDetails.fixedAllowance),
          overtimeHours: new Decimal(payrollDetails.overtimeHours),
          overtimePay: new Decimal(payrollDetails.overtimePay),
          bonusAmount: new Decimal(payrollDetails.bonusAmount),
          deductionsAmount: new Decimal(payrollDetails.deductionsAmount),
          takeHomePay: new Decimal(payrollDetails.takeHomePay),
        },
      });
      return NextResponse.json({
        meta: { code: 201, status: 'success', message: 'Payroll details created successfully' },
        data: newDetail,
      }, { status: 201 });
    }

  } catch (error: any) {
    console.error('Error creating/updating payroll detail:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

// GET: Mengambil detail penggajian untuk periode tertentu
export async function GET(req: Request, { params }: { params: Params }) {
  try {
    const authResult = validateTenantAuth(req as any, (await params).tenantId);
    if (!authResult.success) {
      return authResult.response;
    }

    const { tenantId, payrollPeriodId } = await params;

    const payrollDetails = await prisma.payrollDetail.findMany({
      where: {
        tenantId,
        payrollPeriodId,
      },
      include: {
        staff: true,
      },
    });

    if (payrollDetails.length === 0) {
      return NextResponse.json({
        meta: { code: 404, status: 'error', message: 'No payroll details found for this period' },
        data: null,
      }, { status: 404 });
    }

    return NextResponse.json({
      meta: { code: 200, status: 'success', message: 'Payroll details retrieved successfully' },
      data: payrollDetails,
    });
  } catch (error) {
    console.error('Error fetching payroll details:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
