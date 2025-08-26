/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/app/api/utils/jwt';
import { staffUpdateSchema } from '@/utils/validation/staffSchema';
import bcrypt from 'bcryptjs';

// GET: Mengambil detail staff
export async function GET(req: Request, { params }: { params: { tenantId: string, id: string } }) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1];
    const decoded: any = verifyToken(token as string);
    const tenantIdFromToken = decoded.tenantId;
    const { tenantId, id } = params;

    if (tenantIdFromToken !== tenantId) {
      return NextResponse.json({ error: 'Unauthorized: Tenant ID mismatch' }, { status: 403 });
    }

    const staff = await prisma.staff.findFirst({
      where: { id, tenantId },
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

    if (!staff) {
      return NextResponse.json({ error: 'Staff not found' }, { status: 404 });
    }

    return NextResponse.json(staff);
  } catch (error) {
    console.error('Error fetching staff:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT: Mengedit staff
export async function PUT(req: Request, { params }: { params: { tenantId: string, id: string } }) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1];
    const decoded: any = verifyToken(token as string);
    const tenantIdFromToken = decoded.tenantId;
    const { tenantId, id } = params;

    if (tenantIdFromToken !== tenantId) {
      return NextResponse.json({ error: 'Unauthorized: Tenant ID mismatch' }, { status: 403 });
    }

    const data = await req.json();

    try {
      await staffUpdateSchema.validate(data, { abortEarly: false });
    } catch (validationError: any) {
      return NextResponse.json({ error: 'Validation failed', details: validationError.errors }, { status: 400 });
    }
    
    // Hash password jika ada di body
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }

    const updatedStaff = await prisma.staff.update({
      where: { id, tenantId },
      data,
    });
    
    // Kembalikan data tanpa password
    const { password, ...staffWithoutPassword } = updatedStaff;
    return NextResponse.json(staffWithoutPassword);
  } catch (error) {
    console.error('Error updating staff:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Menghapus staff
export async function DELETE(req: Request, { params }: { params: { tenantId: string, id: string } }) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1];
    const decoded: any = verifyToken(token as string);
    const tenantIdFromToken = decoded.tenantId;
    const { tenantId, id } = params;

    if (tenantIdFromToken !== tenantId) {
      return NextResponse.json({ error: 'Unauthorized: Tenant ID mismatch' }, { status: 403 });
    }
    
    // Staff owner tidak bisa dihapus
    const staffToDelete = await prisma.staff.findFirst({ where: { id, tenantId } });
    if (staffToDelete?.role === 'owner') {
       return NextResponse.json({ error: 'Cannot delete owner staff' }, { status: 403 });
    }

    const deletedStaff = await prisma.staff.delete({
      where: { id, tenantId },
    });

    return NextResponse.json({ message: 'Staff deleted successfully' });
  } catch (error) {
    console.error('Error deleting staff:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}