import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function getMonthYearString(date = new Date()) {
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  return `${months[date.getMonth()]} ${date.getFullYear()}`;
}

export async function GET(req: NextRequest, context: { params: { tenantId: string } }) {
  const { tenantId } = context.params;
  const { searchParams } = new URL(req.url);
  const periodParam = searchParams.get('period');
  let year, month;
  if (periodParam) {
    const [y, m] = periodParam.split('-').map(Number);
    year = y;
    month = m - 1;
  } else {
    const now = new Date();
    year = now.getFullYear();
    month = now.getMonth();
  }
  const period = getMonthYearString(new Date(year, month));

  // Get sales orders for the period
  const orders = await prisma.order.findMany({
    where: {
      tenantId,
      paymentDate: {
        gte: new Date(year, month, 1),
        lt: new Date(year, month + 1, 1),
      },
    },
    include: {
      items: {
        include: {
          product: {
            include: {
              productCategory: true,
            },
          },
        },
      },
    },
  });

  // Aggregate sales data
  let totalSales = 0;
  let totalOrders = orders.length;
  let totalItems = 0;
  const productMap = new Map();

  for (const order of orders) {
    for (const item of order.items) {
      const key = item.productId;
      const productName = item.productName;
      const categoryName = item.product?.productCategory?.name || '-';
      const saleAmount = Number(item.productPrice) * Number(item.qty);
      totalSales += saleAmount;
      totalItems += Number(item.qty);
      if (!productMap.has(key)) {
        productMap.set(key, {
          title: productName,
          category: categoryName,
          saleAmount: 0,
          orderAmount: 0,
          itemCount: 0,
        });
      }
      const prod = productMap.get(key);
      prod.saleAmount += saleAmount;
      prod.orderAmount += 1;
      prod.itemCount += Number(item.qty);
    }
  }

  const details = Array.from(productMap.values());

  // Get tenant name
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { name: true },
  });

  const response = {
    meta: {
      status: 200,
      message: '',
    },
    data: {
      reportTitle: `Laporan Penjualan ${tenant?.name ?? ''}`,
      period,
      summary: {
        totalSales,
        totalOrders,
        totalItems,
      },
      details,
    },
  };

  return NextResponse.json(response);
}
