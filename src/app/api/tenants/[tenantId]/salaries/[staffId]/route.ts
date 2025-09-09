/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { validateTenantAuth } from '@/lib/auth';

type Params = { tenantId: string; staffId: string };

// POST: Membuat atau memperbarui gaji staff
export async function POST(req: Request, { params }: { params: Params }) {
  try {
    const authResult = validateTenantAuth(req as any, params.tenantId);
    if (!authResult.success) {
      return authResult.response;
    }

    const { tenantId, staffId } = params;
    const data = await req.json();

    const existingSalary = await prisma.salary.findUnique({
      where: { staffId },
    });

    if (existingSalary) {
      const updatedSalary = await prisma.salary.update({
        where: { staffId },
        data: {
          basicSalary: data.basicSalary,
          fixedAllowance: data.fixedAllowance,
          updatedAt: new Date(),
        },
      });
      return NextResponse.json({
        meta: { code: 200, status: 'success', message: 'Staff salary updated successfully' },
        data: updatedSalary,
      });
    } else {
      const newSalary = await prisma.salary.create({
        data: {
          tenantId,
          staffId,
          basicSalary: data.basicSalary,
          fixedAllowance: data.fixedAllowance,
        },
      });
      return NextResponse.json({
        meta: { code: 201, status: 'success', message: 'Staff salary created successfully' },
        data: newSalary,
      }, { status: 201 });
    }
  } catch (error) {
    console.error('Error creating/updating staff salary:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET: Mengambil detail gaji staff
export async function GET(req: Request, { params }: { params: Params }) {
  try {
    const authResult = validateTenantAuth(req as any, params.tenantId);
    if (!authResult.success) {
      return authResult.response;
    }

    const { staffId } = params;

    const salary = await prisma.salary.findUnique({
      where: { staffId },
    });

    if (!salary) {
      return NextResponse.json({
        meta: { code: 404, status: 'error', message: 'Staff salary not found' },
        data: null,
      }, { status: 404 });
    }

    return NextResponse.json({
      meta: { code: 200, status: 'success', message: 'Staff salary retrieved successfully' },
      data: salary,
    });
  } catch (error) {
    console.error('Error fetching staff salary:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT: Memperbarui gaji staff
export async function PUT(req: Request, { params }: { params: Params }) {
  try {
    const authResult = validateTenantAuth(req as any, params.tenantId);
    if (!authResult.success) {
      return authResult.response;
    }

    const { tenantId, staffId } = params;
    const data = await req.json();

    const updatedSalary = await prisma.salary.update({
      where: { staffId, tenantId },
      data: {
        basicSalary: data.basicSalary,
        fixedAllowance: data.fixedAllowance,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      meta: { code: 200, status: 'success', message: 'Staff salary updated successfully' },
      data: updatedSalary,
    });
  } catch (error) {
    console.error('Error updating staff salary:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Menghapus gaji staff
export async function DELETE(req: Request, { params }: { params: Params }) {
  try {
    const authResult = validateTenantAuth(req as any, params.tenantId);
    if (!authResult.success) {
      return authResult.response;
    }

    const { tenantId, staffId } = params;

    const deletedSalary = await prisma.salary.delete({
      where: { staffId, tenantId },
    });

    return NextResponse.json({
      meta: { code: 200, status: 'success', message: 'Staff salary deleted successfully' },
      data: deletedSalary,
    });
  } catch (error) {
    console.error('Error deleting staff salary:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
