import { apiResponse } from '@/app/api/utils/response';
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function formatPeriod(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
}

export async function GET(req: NextRequest, context: { params: { tenantId: string } }) {
  const { tenantId } = context.params;
  // Get first order date
  const firstOrder = await prisma.order.findFirst({
    where: { tenantId },
    orderBy: { createdAt: 'asc' },
    select: { createdAt: true },
  });
  if (!firstOrder) {
    return NextResponse.json({ periods: [] });
  }
  const firstDate = firstOrder.createdAt ? new Date(firstOrder.createdAt) : null;
  if (!firstDate) {
    return NextResponse.json({ periods: [] });
  }

  // Get last available period (last month)
  const now = new Date();
  let lastYear = now.getFullYear();
  let lastMonth = now.getMonth() - 1; // last month
  if (lastMonth < 0) {
    lastMonth = 11;
    lastYear -= 1;
  }
  const lastDate = new Date(lastYear, lastMonth, 1);

  // Generate periods
  const periods = [];
  let d = new Date(firstDate.getFullYear(), firstDate.getMonth(), 1);
  while (d <= lastDate) {
    periods.push(formatPeriod(d));
    d.setMonth(d.getMonth() + 1);
  }

  return apiResponse.success({ data: periods });
}
