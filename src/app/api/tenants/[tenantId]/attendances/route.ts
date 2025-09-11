/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { validateTenantAuth } from '@/lib/auth';
import { Decimal } from '@prisma/client/runtime/library';
import { getClientCurrentDateFromInput, getClientCurrentTimeFromInput } from '@/app/api/utils/date';
import { ApiError } from 'next/dist/server/api-utils';

type Params = { tenantId: string };
// POST: Menambahkan absensi manual (untuk admin/owner)
export async function POST(req: Request, { params }: { params: Params }) {
  try {
    const authResult = validateTenantAuth(req as any, params.tenantId);
    if (!authResult.success) {
      return authResult.response;
    }

    const { tenantId } = params;
    const { 
      staffId, 
      date, 
      checkInTime, 
      checkOutTime,
      isWeekend,
    } = await req.json();

    if (!staffId || !date || !checkInTime || !checkOutTime) {
      return NextResponse.json({
        meta: { code: 400, status: 'error', message: 'staffId, date, checkInTime, and checkOutTime are required' },
      }, { status: 400 });
    }

    // Hitung total jam kerja
    const checkIn = getClientCurrentTimeFromInput(req, checkInTime);
    const checkOut = getClientCurrentTimeFromInput(req, checkOutTime);
    const totalHours = new Decimal((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60)).toFixed(2);

    const selectedDate = getClientCurrentDateFromInput(req, date);
    
    // Periksa apakah entri absensi sudah ada
    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        staffId,
        tenantId,
        date: selectedDate,
      },
    });

    if (existingAttendance) {
      return NextResponse.json({
        meta: { code: 409, status: 'error', message: 'Attendance entry for this date already exists for the staff' },
      }, { status: 409 });
    }

    const newAttendance = await prisma.attendance.create({
      data: {
        tenantId,
        staffId,
        date: selectedDate,
        checkInTime: checkIn,
        checkOutTime: checkOut,
        totalHours: new Decimal(totalHours),
        isWeekend: isWeekend ?? (selectedDate.getDay() === 0 || selectedDate.getDay() === 6),
      },
    });

    return NextResponse.json({
      meta: { code: 201, status: 'success', message: 'Attendance recorded successfully' },
      data: newAttendance,
    }, { status: 201 });
  } catch (error) {
    console.error('Error recording attendance:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
// GET: Mengambil daftar kehadiran dengan filter dan paginasi
export async function GET(req: Request, { params }: { params: Params }) {
  try {
    const authResult = validateTenantAuth(req as any, (await params).tenantId);
    if (!authResult.success) {
      return authResult.response;
    }

    const tenantId = authResult.tenantId;
    const { searchParams } = new URL(req.url);
    const p_limit = parseInt(searchParams.get('p_limit') || '10', 10);
    const p_page = parseInt(searchParams.get('p_page') || '1', 10);
    const p_staff_id = searchParams.get('staffId');
    const p_start_date = searchParams.get('periodStart');
    const p_end_date = searchParams.get('periodEnd');

    const whereClause: any = { tenantId };

    if (p_staff_id) whereClause.staffId = p_staff_id;
    if (p_start_date && p_end_date) {
      whereClause.date = {
        gte: new Date(p_start_date),
        lte: new Date(p_end_date),
      };
    }

    const totalCount = await prisma.attendance.count({ where: whereClause });
    const totalPages = Math.ceil(totalCount / p_limit);
    const attendances = await prisma.attendance.findMany({
      where: whereClause,
      take: p_limit,
      skip: (p_page - 1) * p_limit,
      orderBy: { date: 'desc' },
      include: { staff: true },
    });

    const pagination = {
      total_data: totalCount,
      per_page: p_limit,
      current_page: p_page,
      total_page: totalPages,
      next_page: p_page < totalPages ? p_page + 1 : null,
      prev_page: p_page > 1 ? p_page - 1 : null,
    };

    return NextResponse.json({
      meta: { code: 200, status: 'success', message: 'Attendance records retrieved successfully' },
      data: { attendances, pagination },
    });
  } catch (error) {
    console.error('Error fetching attendance records:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
