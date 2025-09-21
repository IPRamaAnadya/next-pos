import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  // Total counts
  const [userCount, tenantCount, staffCount, productCount, orderCount] = await Promise.all([
    prisma.user.count(),
    prisma.tenant.count(),
    prisma.staff.count(),
    prisma.product.count(),
    prisma.order.count(),
  ]);

  // Revenue summary
  const totalRevenue = await prisma.order.aggregate({
    _sum: { grandTotal: true }
  });

  // Recent activity
  const recentOrders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5
  });
  const newUsers = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5
  });
  const newTenants = await prisma.tenant.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5
  });

  // Top products by sales
  const topProducts = await prisma.product.findMany({
    orderBy: { stock: 'desc' },
    take: 5
  });

  return NextResponse.json({
    counts: { userCount, tenantCount, staffCount, productCount, orderCount },
    revenue: totalRevenue._sum.grandTotal || 0,
    recentOrders,
    newUsers,
    newTenants,
    topProducts
  });
}
