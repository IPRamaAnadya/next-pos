// app/api/data/tenants/[tenantId]/summaries/today-expenses/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/app/api/utils/jwt';
import { Prisma } from '@prisma/client';

export async function GET(req: Request, { params }: { params: { tenantId: string } }) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1];
    const decoded: any = verifyToken(token as string);
    const tenantIdFromToken = decoded.tenantId;
    const { tenantId } = await params;

    if (tenantIdFromToken !== tenantId) {
      return NextResponse.json({ error: 'Unauthorized: Tenant ID mismatch' }, { status: 403 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result = await prisma.expense.aggregate({
      _sum: {
        amount: true,
      },
      where: {
        tenantId: tenantId,
        createdAt: {
          gte: today,
        },
      },
    });

    return NextResponse.json({ totalAmount: result._sum.amount?.toNumber() || 0 });
  } catch (error) {
    console.error('Error fetching today\'s expenses summary:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}