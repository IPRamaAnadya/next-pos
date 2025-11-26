import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const products = await prisma.product.findMany();
  return NextResponse.json(products);
}

export async function POST(req: NextRequest) {
  const { name, price, tenantId, productCategoryId, type } = await req.json();
  if (!name || !price || !tenantId || !type) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  const product = await prisma.product.create({ data: { name, price, tenantId, productCategoryId, type } });
  return NextResponse.json(product, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const { id, ...updateData } = await req.json();
  if (!id) return NextResponse.json({ error: 'Missing product id' }, { status: 400 });
  const updated = await prisma.product.update({ where: { id }, data: updateData });
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'Missing product id' }, { status: 400 });
  await prisma.product.delete({ where: { id } });
  return NextResponse.json({}, { status: 204 });
}
