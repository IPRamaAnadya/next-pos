import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const orders = await prisma.order.findMany();
  return NextResponse.json(orders);
}

export async function POST(req: NextRequest) {
  const { orderNo, tenantId, subtotal, totalAmount, paidAmount, staffId } = await req.json();
  if (!orderNo || !tenantId || !subtotal || !totalAmount || !paidAmount) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  const order = await prisma.order.create({ data: { orderNo, tenantId, subtotal, totalAmount, paidAmount, staffId } });
  return NextResponse.json(order, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const { id, ...updateData } = await req.json();
  if (!id) return NextResponse.json({ error: 'Missing order id' }, { status: 400 });
  const updated = await prisma.order.update({ where: { id }, data: updateData });
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'Missing order id' }, { status: 400 });
  await prisma.order.delete({ where: { id } });
  return NextResponse.json({}, { status: 204 });
}
