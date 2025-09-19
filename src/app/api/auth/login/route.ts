import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { generateToken } from '@/app/api/utils/jwt';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    const user = await prisma.user.findUnique({
      where: { email },
      include: { tenants: { select: { id: true } } }
    });
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return NextResponse.json({
        meta: { message: 'Invalid email or password', success: false, code: 401 }
      }, { status: 401 });
    }

    const staffAccount = await prisma.staff.findFirst({
      where: {
        isOwner: true
      }
    });

    const payload = {
      userId: user.id,
      tenantId: user.tenants[0]?.id,
      role: 'owner',
      staffId: staffAccount?.id
    };
    const token = generateToken(payload);
    return NextResponse.json({ token, user: payload });
  } catch (error) {
    return NextResponse.json({
      meta: { message: 'Internal server error', success: false, code: 500 }
    }, { status: 500 });
  }
}