import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const tenants = await prisma.tenant.findMany();
  return NextResponse.json(tenants);
}

export async function POST(req: NextRequest) {
  const { name, email, userId } = await req.json();
  if (!name || !email || !userId) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  const tenant = await prisma.tenant.create({ data: { name, email, userId } });
  return NextResponse.json(tenant, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const { id, ...updateData } = await req.json();
  if (!id) return NextResponse.json({ error: 'Missing tenant id' }, { status: 400 });
  const updated = await prisma.tenant.update({ where: { id }, data: updateData });
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'Missing tenant id' }, { status: 400 });
  await prisma.tenant.delete({ where: { id } });
  return NextResponse.json({}, { status: 204 });
}
