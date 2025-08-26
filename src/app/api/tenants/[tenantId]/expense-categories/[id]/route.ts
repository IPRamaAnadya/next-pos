/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/app/api/utils/jwt';
import { expenseCategoryUpdateSchema } from '@/utils/validation/expenseSchema';

// PUT: Mengedit kategori pengeluaran
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
      await expenseCategoryUpdateSchema.validate(data, { abortEarly: false });
    } catch (validationError: any) {
      return NextResponse.json({ error: 'Validation failed', details: validationError.errors }, { status: 400 });
    }
    const updatedCategory = await prisma.expenseCategory.update({ where: { id, tenantId }, data });
    return NextResponse.json(updatedCategory);
  } catch (error) {
    console.error('Error updating expense category:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Menghapus kategori pengeluaran
export async function DELETE(req: Request, { params }: { params: { tenantId: string, id: string } }) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1];
    const decoded: any = verifyToken(token as string);
    const tenantIdFromToken = decoded.tenantId;
    const { tenantId, id } = params;
    if (tenantIdFromToken !== tenantId) {
      return NextResponse.json({ error: 'Unauthorized: Tenant ID mismatch' }, { status: 403 });
    }
    const deletedCategory = await prisma.expenseCategory.delete({ where: { id, tenantId } });
    return NextResponse.json({ message: 'Expense category deleted successfully' });
  } catch (error) {
    console.error('Error deleting expense category:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}