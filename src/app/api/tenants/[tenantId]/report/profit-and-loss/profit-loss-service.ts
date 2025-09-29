import prisma from '@/lib/prisma';

function getMonthYearString(date = new Date()) {
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  return `${months[date.getMonth()]} ${date.getFullYear()}`;
}

export async function getProfitAndLossReportData(tenantId: string, periodParam?: string) {
  // Fetch tenant name
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  const tenantName = tenant?.name || "";
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

  // Get total sales (Pendapatan)
  const sales = await prisma.order.aggregate({
    _sum: { grandTotal: true },
    where: {
      tenantId,
      paymentDate: {
        gte: new Date(year, month, 1),
        lt: new Date(year, month + 1, 1),
      },
    },
  });
  const totalPendapatan = Number(sales._sum.grandTotal ?? 0);

  // Get expense categories and their totals (Beban)
  const expenseCategories = await prisma.expenseCategory.findMany({
    where: { tenantId },
    include: {
      expenses: {
        where: {
          createdAt: {
            gte: new Date(year, month, 1),
            lt: new Date(year, month + 1, 1),
          },
        },
      },
    },
  });

  let bebanItems = [];
  let totalBeban = 0;
  for (const cat of expenseCategories) {
    const value = cat.expenses.reduce((sum, e) => sum + Number(e.amount), 0);
    totalBeban += value;
    bebanItems.push({
      classification: cat.name,
      value,
      percentage: totalPendapatan ? value / totalPendapatan : 0,
      total: null,
    });
  }

  // Pajak 11%
  const pajak = 0;
  const labaSebelumPajak = totalPendapatan - totalBeban;
  const labaBersih = labaSebelumPajak;

  return {
    reportTitle: `Laporan Laba Rugi ${tenantName}`,
    period,
    data: [
      {
        category: 'Pendapatan',
        items: [
          {
            classification: 'Penjualan',
            value: totalPendapatan,
            percentage: 1,
            total: null,
          },
          {
            classification: 'Total Pendapatan',
            value: null,
            percentage: null,
            total: totalPendapatan,
          },
        ],
      },
      {
        category: 'Beban',
        items: bebanItems,
      },
    ],
    summary: [
      {
        label: 'Laba Sebelum Pajak',
        value: labaSebelumPajak,
        percentage: totalPendapatan ? labaSebelumPajak / totalPendapatan : 0,
      },
      {
        label: 'Pajak',
        value: pajak,
        percentage: totalPendapatan ? pajak / totalPendapatan : 0,
      },
      {
        label: 'Laba Bersih',
        value: labaBersih,
        percentage: totalPendapatan ? labaBersih / totalPendapatan : 0,
      },
    ],
  };
}
