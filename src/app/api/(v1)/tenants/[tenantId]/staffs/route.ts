/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/app/api/utils/jwt';
import { staffCreateSchema } from '@/utils/validation/staffSchema';
import { enforceLimit } from '@/lib/subscriptionLimit';
import { apiResponse } from '@/app/api/utils/response';
import bcrypt from 'bcryptjs';

// GET: Mengambil daftar semua staff
export async function GET(req: Request, { params }: { params: { tenantId: string } }) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1];
    const decoded: any = verifyToken(token as string);
    const tenantIdFromToken = decoded.tenantId;
    const tenantIdFromUrl = (await params).tenantId;

    if (tenantIdFromToken !== tenantIdFromUrl) {
      return NextResponse.json({ error: 'Unauthorized: Tenant ID mismatch' }, { status: 403 });
    }

    const staffs = await prisma.staff.findMany({
      where: { tenantId: tenantIdFromUrl },
      // Penting: Jangan sertakan password dalam respons
      select: {
        id: true,
        username: true,
        role: true,
        tenantId: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    return NextResponse.json({
      data: staffs
    });
  } catch (error) {
    console.error('Error fetching staffs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Membuat staff baru
export async function POST(req: Request, { params }: { params: { tenantId: string } }) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1];
    const decoded: any = verifyToken(token as string);
    const tenantIdFromToken = decoded.tenantId;
    const tenantIdFromUrl = (await params).tenantId;

    if (tenantIdFromToken !== tenantIdFromUrl) {
      return NextResponse.json({ error: 'Unauthorized: Tenant ID mismatch' }, { status: 403 });
    }

    const data = await req.json();

    try {
      await staffCreateSchema.validate(data, { abortEarly: false });
    } catch (validationError: any) {
      return NextResponse.json({ error: 'Validation failed', details: validationError.errors }, { status: 400 });
    }

    // enforce staff limit
    try {
      await enforceLimit(tenantIdFromUrl, 'staff', 1);
    } catch (err: any) {
      return apiResponse.limitExceeded('staff', (await (await import('@/lib/subscriptionLimit')).default.getLimitsForTenant(tenantIdFromUrl)).staff);
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const newStaff = await prisma.staff.create({
      data: {
        username: data.username,
        password: hashedPassword,
        role: data.role,
        tenantId: tenantIdFromUrl,
      },
    });

    // Kembalikan data tanpa password
    const { password, ...staffWithoutPassword } = newStaff;
    return NextResponse.json(staffWithoutPassword, { status: 201 });
  } catch (error) {
    console.error('Error creating staff:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}