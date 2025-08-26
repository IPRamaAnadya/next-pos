/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/app/api/utils/jwt';
import { discountUpdateSchema } from '@/utils/validation/discountSchema';

// GET: Mengambil detail diskon
export async function GET(req: Request, { params }: { params: { tenantId: string, id: string } }) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1];
    const decoded: any = verifyToken(token as string);
    const tenantIdFromToken = decoded.tenantId;
    const { tenantId, id } = params;

    if (tenantIdFromToken !== tenantId) {
      return NextResponse.json({ error: 'Unauthorized: Tenant ID mismatch' }, { status: 403 });
    }

    const discount = await prisma.discount.findFirst({
      where: { id, tenantId },
    });

    if (!discount) {
      return NextResponse.json({ error: 'Discount not found' }, { status: 404 });
    }

    return NextResponse.json(discount);
  } catch (error) {
    console.error('Error fetching discount:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT: Mengedit diskon
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
      await discountUpdateSchema.validate(data, { abortEarly: false });
    } catch (validationError: any) {
      return NextResponse.json({ error: 'Validation failed', details: validationError.errors }, { status: 400 });
    }

    const updatedDiscount = await prisma.discount.update({
      where: { id, tenantId },
      data,
    });

    return NextResponse.json(updatedDiscount);
  } catch (error) {
    console.error('Error updating discount:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Menghapus diskon
export async function DELETE(req: Request, { params }: { params: { tenantId: string, id: string } }) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1];
    const decoded: any = verifyToken(token as string);
    const tenantIdFromToken = decoded.tenantId;
    const { tenantId, id } = params;

    if (tenantIdFromToken !== tenantId) {
      return NextResponse.json({ error: 'Unauthorized: Tenant ID mismatch' }, { status: 403 });
    }

    const deletedDiscount = await prisma.discount.delete({
      where: { id, tenantId },
    });

    return NextResponse.json({ message: 'Discount deleted successfully' });
  } catch (error) {
    console.error('Error deleting discount:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}