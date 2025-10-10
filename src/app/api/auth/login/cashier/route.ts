import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { generateToken, createAuthPayloadWithLimits } from '@/app/api/utils/jwt';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    const user = await prisma.user.findUnique({
      where: { email },
      include: { tenants: { select: { id: true } } }
    });
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const staffAccount = await prisma.staff.findFirst({
      where: {
        isOwner: true
      }
    });

    const basePayload = {
      userId: user.id,
      tenantId: user.tenants[0]?.id,
      role: 'staff',
      staffId: staffAccount?.id ?? null,
    };
    const enriched = await createAuthPayloadWithLimits(basePayload);
    const token = generateToken(enriched);
    return NextResponse.json({ token, user: enriched });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}