// app/api/data/tenants/[tenantId]/summaries/daily-payment-received/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/app/api/utils/jwt';
import { Prisma } from '@prisma/client';
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';

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

    const clientTimezone = req.headers.get('X-Timezone-Name') || 'Asia/Jakarta';

    // if startDate and endDate is empty or null, change to current time with format like 2025-08-13
    if (!startDate || !endDate) {
      const now = new Date();
      const localNow = formatInTimeZone(now, clientTimezone, 'yyyy-MM-dd');
      startDate = localNow;
      endDate = startDate;
    }

    // Konversi local start dan end ke UTC
    const startOfDayLocal = new Date(`${startDate}T00:00:00`);
    const endOfDayLocal = new Date(`${endDate}T23:59:59`);

    const startUtc = fromZonedTime(startOfDayLocal, clientTimezone);
    const endUtc = fromZonedTime(endOfDayLocal, clientTimezone);

    const total = await prisma.order.aggregate({
      _sum: {
        grandTotal: true,
      },
      where: {
        tenantId: tenantId,
        paymentStatus: 'paid',
        paymentDate: {
          gte: startUtc,
          lte: endUtc,
        },
      },
    });
    
    const jsonResponse = {
      data: {
        daily_payment_received: total._sum.grandTotal
      }
    }

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json({ 
      meta: {
        error: 'Internal server error',
        message: 'Internal server error'
      }
     }, { status: 500 });
  }
}