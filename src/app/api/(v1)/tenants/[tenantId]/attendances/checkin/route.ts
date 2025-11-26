/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { validateTenantAuth } from '@/lib/auth';
import { getClientCurrentDate, getClientCurrentTime } from '@/app/api/utils/date';

type Params = Promise<{ tenantId: string }>;

// POST: Mencatat waktu check-in staff
export async function POST(req: Request, { params }: { params: Params }) {
  try {
    const authResult = validateTenantAuth(req as any, (await params).tenantId);
    if (!authResult.success) {
      return authResult.response;
    }

    const { tenantId } = await params;
    const { staffId } = await req.json();
    const currentDate = getClientCurrentDate(req);

    // Periksa apakah staffId valid
    const staff = await prisma.staff.findUnique({ where: { id: staffId } });
    if (!staff) {
      return NextResponse.json({
        meta: { code: 404, status: 'error', message: 'Staff not found' },
      }, { status: 404 });
    }

    // Periksa apakah staff sudah check-in hari ini
    const existingCheckin = await prisma.attendance.findUnique({
      where: {
        tenantId_staffId_date: {
          tenantId,
          staffId,
          date: currentDate,
        },
      },
    });

    if (existingCheckin) {
      return NextResponse.json({
        meta: { code: 409, status: 'error', message: 'Staff has already checked in today' },
      }, { status: 409 });
    }

    const newAttendance = await prisma.attendance.create({
      data: {
        tenantId,
        staffId,
        date: currentDate,
        checkInTime: getClientCurrentTime(req),
        isWeekend: (currentDate.getDay() === 0 || currentDate.getDay() === 6),
      },
    });

    return NextResponse.json({
      meta: { code: 201, status: 'success', message: 'Check-in recorded successfully' },
      data: newAttendance,
    }, { status: 201 });
  } catch (error) {
    console.error('Error recording check-in:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
