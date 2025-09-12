/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { validateTenantAuth } from '@/lib/auth';
import { Decimal } from '@prisma/client/runtime/library';
import { calculateWorkHours, getClientCurrentDateFromInput, getClientCurrentTimeFromInput } from '@/app/api/utils/date';

type Params = { tenantId: string; id: string };

// GET: Mengambil detail absensi
export async function GET(req: Request, { params }: { params: Params }) {
  try {
    const authResult = validateTenantAuth(req as any, params.tenantId);
    if (!authResult.success) {
      return authResult.response;
    }

    const { tenantId, id } = params;

    const attendance = await prisma.attendance.findUnique({
      where: {
        id,
        tenantId,
      },
    });

    if (!attendance) {
      return NextResponse.json({
        meta: { code: 404, status: 'error', message: 'Attendance entry not found' },
      }, { status: 404 });
    }

    return NextResponse.json({
      meta: { code: 200, status: 'success', message: 'Attendance entry retrieved successfully' },
      data: attendance,
    });
  } catch (error) {
    console.error('Error fetching attendance entry:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT: Memperbarui absensi
export async function PUT(req: Request, { params }: { params: Params }) {
  try {
    const authResult = validateTenantAuth(req as any, (await params).tenantId);
    if (!authResult.success) {
      return authResult.response;
    }

    const { tenantId, id } = await params;
    const { checkInTime, checkOutTime, date, isWeekend } = await req.json();

    // Hitung total jam kerja jika waktu diubah
    let totalHours = calculateWorkHours(checkInTime, checkOutTime);
    if (totalHours !== null) {
      totalHours = parseFloat(totalHours.toFixed(2)); // Bulatkan ke 2 desimal
    }

    const selectedDate = getClientCurrentDateFromInput(req, date);
    
    const updatedAttendance = await prisma.attendance.update({
      where: {
        id,
        tenantId,
      },
      data: {
        date: date ? selectedDate : undefined,
        checkInTime: checkInTime ,
        checkOutTime: checkOutTime,
        totalHours: totalHours ? new Decimal(totalHours) : undefined,
        isWeekend: isWeekend,
      },
    });

    return NextResponse.json({
      meta: { code: 200, status: 'success', message: 'Attendance entry updated successfully' },
      data: updatedAttendance,
    });
  } catch (error) {
    console.error('Error updating attendance entry:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Menghapus absensi
export async function DELETE(req: Request, { params }: { params: Params }) {
  try {
    const authResult = validateTenantAuth(req as any, params.tenantId);
    if (!authResult.success) {
      return authResult.response;
    }

    const { tenantId, id } = params;

    await prisma.attendance.delete({
      where: {
        id,
        tenantId,
      },
    });

    return NextResponse.json({
      meta: { code: 200, status: 'success', message: 'Attendance entry deleted successfully' },
    });
  } catch (error) {
    console.error('Error deleting attendance entry:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}