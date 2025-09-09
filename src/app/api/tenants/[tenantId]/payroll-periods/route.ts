/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { validateTenantAuth } from '@/lib/auth';

type Params = { tenantId: string };

// POST: Membuat periode penggajian baru
export async function POST(req: Request, { params }: { params: Params }) {
  try {
    const authResult = validateTenantAuth(req as any, params.tenantId);
    if (!authResult.success) {
      return authResult.response;
    }

    const { tenantId } = params;
    const { periodStart, periodEnd } = await req.json();

    const newPeriod = await prisma.payrollPeriod.create({
      data: {
        tenantId,
        periodStart: new Date(periodStart),
        periodEnd: new Date(periodEnd),
      },
    });

    return NextResponse.json({
      meta: { code: 201, status: 'success', message: 'Payroll period created successfully' },
      data: newPeriod,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating payroll period:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET: Mengambil daftar periode penggajian
export async function GET(req: Request, { params }: { params: Params }) {
  try {
    const authResult = validateTenantAuth(req as any, params.tenantId);
    if (!authResult.success) {
      return authResult.response;
    }

    const tenantId = authResult.tenantId;

    const payrollPeriods = await prisma.payrollPeriod.findMany({
      where: { tenantId },
      orderBy: { periodStart: 'desc' },
    });

    return NextResponse.json({
      meta: { code: 200, status: 'success', message: 'Payroll periods retrieved successfully' },
      data: payrollPeriods,
    });
  } catch (error) {
    console.error('Error fetching payroll periods:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
