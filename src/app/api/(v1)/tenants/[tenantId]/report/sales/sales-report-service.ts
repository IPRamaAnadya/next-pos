import { toUtcFromTz } from '@/lib/dateTz';
import prisma from '@/lib/prisma';
import { NextRequest } from 'next/server';

function getMonthYearString(date = new Date()) {
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  return `${months[date.getMonth()]} ${date.getFullYear()}`;
}

export async function getSalesReportData(tenantId: string, req: NextRequest, periodParam?: string) {
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

  let clientTimeZone = req.headers.get('X-Timezone-Name') || 'Asia/Makassar';
  const localStart = `${year}-${(month + 1).toString().padStart(2, '0')}-01T00:00:00`;
  const localEnd = `${year}-${(month + 2).toString().padStart(2, '0')}-01T00:00:00`;

  // step 2: convert local time in client timezone to UTC
  const gte = toUtcFromTz(localStart, clientTimeZone);
  const lt = toUtcFromTz(localEnd, clientTimeZone);

  // Get sales orders for the period
  const orders = await prisma.order.findMany({
    where: {
      tenantId,
      paymentDate: {
        gte,
        lt,
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
  let totalSalesBruto = 0;
  let totalDiscounts = 0;
  let totalSales = 0;
  let totalOrders = orders.length;
  let totalItems = 0;
  const productMap = new Map();

  for (const order of orders) {
    let orderBruto = 0;
    for (const item of order.items) {
      const key = item.productId;
      const productName = item.productName;
      const categoryName = item.product?.productCategory?.name || '-';
      const saleAmount = Number(item.productPrice) * Number(item.qty);
      orderBruto += saleAmount;
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
    totalSalesBruto += orderBruto;
    totalDiscounts += Number(order.discountAmount || 0);
    totalSales += orderBruto - Number(order.discountAmount || 0);
  }

  const details = Array.from(productMap.values());

  // Get tenant name
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { name: true },
  });
  const tenantName = tenant?.name || '-';

  return {
    reportTitle: 'Laporan Penjualan ' + tenantName,
    period,
    tenantName,
    summary: {
      totalSalesBruto,
      totalOrders,
      totalItems,
      totalDiscounts,
      totalSales,
    },
    details,
  };
}
