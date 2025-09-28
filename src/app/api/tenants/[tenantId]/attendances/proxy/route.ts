/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { validateTenantAuth } from '@/lib/auth';
import { calculateWorkHours, getClientCurrentDate, getClientCurrentTime } from '@/app/api/utils/date';

type Params = { tenantId: string };

// POST: Melakukan check-in atau check-out dengan otentikasi username dan password
export async function POST(req: Request, { params }: { params: Params }) {
  try {
    const authResult = validateTenantAuth(req as any, (await params).tenantId);
    if (!authResult.success) {
      return authResult.response;
    }

    const { tenantId } = await params;
    const { username, password, action } = await req.json(); // 'checkin' atau 'checkout'

    // Cari staff berdasarkan username
    const staff = await prisma.staff.findUnique({
      where: {
        tenantId_username: {
          tenantId,
          username,
        },
      },
    });

    if (!staff) {
      return NextResponse.json({
        meta: { code: 404, status: 'error', message: 'Staff not found' },
      }, { status: 404 });
    }

    // Verifikasi password
    const isPasswordValid = await bcrypt.compare(password, staff.password);
    if (!isPasswordValid) {
      return NextResponse.json({
        meta: { code: 401, status: 'error', message: 'Invalid password' },
      }, { status: 401 });
    }

    const currentDate = getClientCurrentDate(req);

    let attendanceRecord;

    if (action === 'checkin') {
      // Logic untuk check-in
      attendanceRecord = await prisma.attendance.findUnique({
        where: {
          tenantId_staffId_date: {
            tenantId,
            staffId: staff.id,
            date: currentDate,
          },
        },
      });

      if (attendanceRecord) {
        return NextResponse.json({
          meta: { code: 409, status: 'error', message: 'Staff has already checked in today' },
        }, { status: 409 });
      }

      const newAttendance = await prisma.attendance.create({
        data: {
          tenantId,
          staffId: staff.id,
          date: currentDate,
          checkInTime: getClientCurrentTime(req),
          isWeekend: (currentDate.getDay() === 0 || currentDate.getDay() === 6),
        },
      });

      return NextResponse.json({
        meta: { code: 201, status: 'success', message: 'Check-in recorded successfully' },
        data: newAttendance,
      }, { status: 201 });

    } else if (action === 'checkout') {
      // Logic untuk check-out
      attendanceRecord = await prisma.attendance.findUnique({
        where: {
          tenantId_staffId_date: {
            tenantId,
            staffId: staff.id,
            date: currentDate,
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

      const checkOutTime = getClientCurrentTime(req);
      const checkInTime = attendanceRecord.checkInTime;

      // Hitung total jam kerja
      const totalHours = calculateWorkHours(checkInTime, checkOutTime);

      const updatedAttendance = await prisma.attendance.update({
        where: {
          tenantId_staffId_date: {
            tenantId,
            staffId: staff.id,
            date: currentDate,
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

    } else {
      return NextResponse.json({
        meta: { code: 400, status: 'error', message: 'Invalid action. Use "checkin" or "checkout".' },
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in attendance proxy:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
