// app/api/data/tenants/[tenantId]/summaries/daily-payment-received/route.ts
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

    const { searchParams } = new URL(req.url);
    var startDate = searchParams.get('start_date');
    var endDate = searchParams.get('end_date');

    // if startDate and endDate is empty or null, change to current time with format like 2025-08-13
    if (!startDate || !endDate) {
      const now = new Date();
      const startOfDay = new Date(now.setHours(0, 0, 0, 0));
      const endOfDay = new Date(now.setHours(23, 59, 59, 999));
      startDate = startOfDay.toISOString().split('T')[0];
      endDate = endOfDay.toISOString().split('T')[0];
    }

    const result: any = await prisma.$queryRaw`
      SELECT
          DATE(o.payment_date) AS date,
          SUM(o.grand_total) AS total_amount
      FROM "Order" o
      WHERE
          tenant_id = ${tenantId}::uuid
          AND payment_status = 'paid'
          AND o.payment_date >= ${startDate}::timestamp
          AND o.payment_date <= ${endDate}::timestamp + INTERVAL '1 day'
      GROUP BY
          DATE(payment_date)
      ORDER BY
          date DESC;
    `;

    const jsonResponse = {
      data: {
        daily_payment_received: result.total_amount ?? 0
      }
    }

    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error('Error fetching daily payment received:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}