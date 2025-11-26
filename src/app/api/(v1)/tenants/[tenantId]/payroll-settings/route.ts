/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { validateTenantAuth } from '@/lib/auth';

type Params = { tenantId: string };

// POST: Mengatur atau memperbarui payroll settings
export async function POST(req: Request, { params }: { params: Params }) {
  try {
    const authResult = validateTenantAuth(req as any, params.tenantId);
    if (!authResult.success) {
      return authResult.response;
    }

    const tenantId = authResult.tenantId;
    const data = await req.json();

    const existingSetting = await prisma.payrollSetting.findUnique({
      where: { tenantId },
    });

    if (existingSetting) {
      const updatedSetting = await prisma.payrollSetting.update({
        where: { tenantId },
        data: {
          ...data,
          updatedAt: new Date(),
        },
      });
      return NextResponse.json({
        meta: { code: 200, status: 'success', message: 'Payroll settings updated successfully' },
        data: updatedSetting,
      });
    } else {
      const newSetting = await prisma.payrollSetting.create({
        data: {
          ...data,
          tenantId,
        },
      });
      return NextResponse.json({
        meta: { code: 201, status: 'success', message: 'Payroll settings created successfully' },
        data: newSetting,
      }, { status: 201 });
    }
  } catch (error) {
    console.error('Error setting payroll settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET: Mengambil payroll settings
export async function GET(req: Request, { params }: { params: Params }) {
  try {
    const authResult = validateTenantAuth(req as any, params.tenantId);
    if (!authResult.success) {
      return authResult.response;
    }

    const tenantId = authResult.tenantId;

    const payrollSetting = await prisma.payrollSetting.findUnique({
      where: { tenantId },
    });

    if (!payrollSetting) {
      return NextResponse.json({
        meta: { code: 404, status: 'error', message: 'Payroll settings not found' },
        data: null,
      }, { status: 404 });
    }

    return NextResponse.json({
      meta: { code: 200, status: 'success', message: 'Payroll settings retrieved successfully' },
      data: payrollSetting,
    });
  } catch (error) {
    console.error('Error fetching payroll settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
