/**
 * API Routes: /api/v2/tenants/[tenantId]/reports/available-periods
 * GET - Get available report periods (previous months only)
 */

import { NextRequest } from 'next/server';
import { verifyToken } from '@/app/api/utils/jwt';
import { apiResponse } from '@/app/api/utils/response';
import prisma from '@/lib/prisma';

function formatPeriod(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  try {
    const { tenantId } = await params;

    // Verify JWT token
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return apiResponse.unauthorized('Missing or invalid authorization header');
    }

    const token = authHeader.substring(7);
    const decoded = await verifyToken(token);

    if (!decoded || !decoded.tenantId) {
      return apiResponse.unauthorized('Invalid token');
    }

    if (decoded.tenantId !== tenantId) {
      return apiResponse.forbidden('Access denied to this tenant');
    }

    // Get first order date
    const firstOrder = await prisma.order.findFirst({
      where: { tenantId },
      orderBy: { createdAt: 'asc' },
      select: { createdAt: true },
    });

    if (!firstOrder || !firstOrder.createdAt) {
      return apiResponse.success({
        data: [],
        message: 'No periods available',
      });
    }

    const firstDate = new Date(firstOrder.createdAt);

    // Get last available period (last month, excluding current month)
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

    return apiResponse.success({
      data: periods,
      message: 'Available periods retrieved successfully',
    });
  } catch (error: any) {
    console.error('Get available periods error:', error);
    return apiResponse.internalError();
  }
}
