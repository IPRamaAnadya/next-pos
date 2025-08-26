/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/app/api/utils/jwt';
import { productCategoryCreateSchema } from '@/utils/validation/productCategorySchema';

export async function GET(req: Request, { params }: { params: { tenantId: string } }) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1];
    const decoded: any = verifyToken(token as string);
    const tenantIdFromToken = decoded.tenantId;
    const tenantIdFromUrl = params.tenantId;
    if (tenantIdFromToken !== tenantIdFromUrl) {
      return NextResponse.json({ error: 'Unauthorized: Tenant ID mismatch' }, { status: 403 });
    }
    const categories = await prisma.productCategory.findMany({ where: { tenantId: tenantIdFromUrl } });
    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error fetching product categories:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: { tenantId: string } }) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1];
    const decoded: any = verifyToken(token as string);
    const tenantIdFromToken = decoded.tenantId;
    const tenantIdFromUrl = params.tenantId;
    if (tenantIdFromToken !== tenantIdFromUrl) {
      return NextResponse.json({ error: 'Unauthorized: Tenant ID mismatch' }, { status: 403 });
    }
    const data = await req.json();
    try {
      await productCategoryCreateSchema.validate(data, { abortEarly: false });
    } catch (validationError: any) {
      return NextResponse.json({ error: 'Validation failed', details: validationError.errors }, { status: 400 });
    }
    const newCategory = await prisma.productCategory.create({ data: { ...data, tenantId: tenantIdFromUrl } });
    return NextResponse.json(newCategory, { status: 201 });
  } catch (error) {
    console.error('Error creating product category:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}