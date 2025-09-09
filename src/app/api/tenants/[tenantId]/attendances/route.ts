/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { validateTenantAuth } from '@/lib/auth';

type Params = { tenantId: string };

// POST: Mencatat kehadiran (check-in/check-out)
export async function POST(req: Request, { params }: { params: Params }) {
  try {
    const authResult = validateTenantAuth(req as any, params.tenantId);
    if (!authResult.success) {
      return authResult.response;
    }

    const { tenantId } = params;
    const { staffId, checkInTime, checkOutTime, date, isWeekend } = await req.json();

    let dataToCreate: any = { tenantId, staffId, date: new Date(date) };
    if (checkInTime) dataToCreate.checkInTime = new Date(checkInTime);
    if (checkOutTime) dataToCreate.checkOutTime = new Date(checkOutTime);
    if (isWeekend !== undefined) dataToCreate.isWeekend = isWeekend;

    if (checkInTime && checkOutTime) {
      const checkIn = new Date(checkInTime);
      const checkOut = new Date(checkOutTime);
      const diffInMs = checkOut.getTime() - checkIn.getTime();
      dataToCreate.totalHours = diffInMs / (1000 * 60 * 60);
    }

    const attendanceRecord = await prisma.attendance.upsert({
      where: {
        tenantId_staffId_date: {
          tenantId,
          staffId,
          date: new Date(date),
        },
      },
      update: {
        ...dataToCreate,
        updatedAt: new Date(),
      },
      create: dataToCreate,
    });

    return NextResponse.json({
      meta: { code: 200, status: 'success', message: 'Attendance record created/updated successfully' },
      data: attendanceRecord,
    });
  } catch (error) {
    console.error('Error creating/updating attendance record:', error);
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
