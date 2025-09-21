import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const staffs = await prisma.staff.findMany();
  return NextResponse.json(staffs);
}

export async function POST(req: NextRequest) {
  const { username, password, role, tenantId, isOwner } = await req.json();
  if (!username || !password || !role || !tenantId) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  const staff = await prisma.staff.create({ data: { username, password, role, tenantId, isOwner: !!isOwner } });
  return NextResponse.json(staff, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const { id, ...updateData } = await req.json();
  if (!id) return NextResponse.json({ error: 'Missing staff id' }, { status: 400 });
  const updated = await prisma.staff.update({ where: { id }, data: updateData });
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'Missing staff id' }, { status: 400 });
  await prisma.staff.delete({ where: { id } });
  return NextResponse.json({}, { status: 204 });
}
