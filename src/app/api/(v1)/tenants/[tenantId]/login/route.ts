import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';

export async function POST(req: Request, { params }: { params: { tenantId: string } }) {
  try {
    const { username, password } = await req.json();
    const { tenantId } = params;

    if (!username || !password) {
      return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });
    }

    const staff = await prisma.staff.findFirst({
      where: {
        tenantId: tenantId,
        username: username,
      },
    });

    if (!staff) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const isPasswordValid = bcrypt.compareSync(password, staff.password);

    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    return NextResponse.json({
      staffId: staff.id,
      username: staff.username,
      role: staff.role,
      tenantId: staff.tenantId,
    });
  } catch (error) {
    console.error('Staff login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}