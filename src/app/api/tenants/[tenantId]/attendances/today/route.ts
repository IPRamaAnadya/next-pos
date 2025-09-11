/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { validateTenantAuth } from '@/lib/auth';
import { formatInTimeZone, fromZonedTime, toZonedTime } from 'date-fns-tz';
import {getClientCurrentDate} from '@/app/api/utils/date';

type Params = { tenantId: string };

// GET: Mengambil status absensi staff hari ini
export async function GET(req: Request, { params }: { params: Params }) {
  try {
    const authResult = validateTenantAuth(req as any, (await params).tenantId);
    if (!authResult.success) {
      return authResult.response;
    }

    const { searchParams } = new URL(req.url);
    const staffId = searchParams.get('staffId');
    const tenantId = (await params).tenantId;

    if (!staffId) {
      return NextResponse.json({
        meta: { code: 400, status: 'error', message: 'staffId is required' },
      }, { status: 400 });
    }

    const currentDate = getClientCurrentDate(req);

    const attendance = await prisma.attendance.findFirst({
      where: {
        staffId,
        tenantId,
        date: currentDate
      },
    });

    let status = 'not_checked_in';
    if (attendance?.checkInTime) {
      status = 'checked_in';
    }
    if (attendance?.checkOutTime) {
      status = 'checked_out';
    }

    const jsonResponse = {
      meta: { code: 200, status: 'success', message: 'Attendance status retrieved successfully' },
      data: {
        status,
        checkInTime: attendance?.checkInTime,
        checkOutTime: attendance?.checkOutTime,
      },
    };

    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error('Error fetching today attendance status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
