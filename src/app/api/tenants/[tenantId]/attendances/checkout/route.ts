/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { validateTenantAuth } from '@/lib/auth';
import { Decimal } from '@prisma/client/runtime/library';

type Params = { tenantId: string };

// POST: Mencatat waktu check-out staff
export async function POST(req: Request, { params }: { params: Params }) {
  try {
    const authResult = validateTenantAuth(req as any, params.tenantId);
    if (!authResult.success) {
      return authResult.response;
    }

    const { tenantId } = params;
    const { staffId } = await req.json();
    const date = new Date().toISOString().split('T')[0];

    const attendanceRecord = await prisma.attendance.findUnique({
      where: {
        tenantId_staffId_date: {
          tenantId,
          staffId,
          date: new Date(date),
        },
      },
    });

    if (!attendanceRecord || !attendanceRecord.checkInTime) {
      return NextResponse.json({
        meta: { code: 404, status: 'error', message: 'No check-in record found for today' },
      }, { status: 404 });
    }

    if (attendanceRecord.checkOutTime) {
      return NextResponse.json({
        meta: { code: 409, status: 'error', message: 'Staff has already checked out today' },
      }, { status: 409 });
    }

    const checkOutTime = new Date();
    const checkInTime = attendanceRecord.checkInTime;

    // Hitung total jam kerja
    const totalMilliseconds = checkOutTime.getTime() - checkInTime.getTime();
    const totalHours = new Decimal(totalMilliseconds / (1000 * 60 * 60));

    const updatedAttendance = await prisma.attendance.update({
      where: {
        tenantId_staffId_date: {
          tenantId,
          staffId,
          date: new Date(date),
        },
      },
      data: {
        checkOutTime,
        totalHours,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      meta: { code: 200, status: 'success', message: 'Check-out recorded successfully' },
      data: updatedAttendance,
    });
  } catch (error) {
    console.error('Error recording check-out:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
