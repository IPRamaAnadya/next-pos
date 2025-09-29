import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export async function generateSalesReportPdf({
  reportTitle,
  period,
  summary,
  details,
}: {
  reportTitle: string;
  period: string;
  summary: {
    totalSalesBruto: number;
    totalOrders: number;
    totalItems: number;
    totalDiscounts: number;
    totalSales: number;
  };
  details: Array<{
    title: string;
    category: string;
    saleAmount: number;
    orderAmount: number;
    itemCount: number;
  }>;
}) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
  const { width, height } = page.getSize();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  // Header
  page.drawText(reportTitle, {
    x: 50,
    y: height - 60,
    size: 18,
    font,
    color: rgb(0, 0, 0),
  });
  page.drawText(`Periode ${period}`, {
    x: 50,
    y: height - 90,
    size: 12,
    font,
    color: rgb(0, 0, 0),
  });

  // Table header
  const tableTop = height - 130;
  const rowHeight = 16;
  const colWidths = [160, 100, 80, 80, 80];
  const headers = ['Produk', 'Kategori', 'Penjualan', 'Order', 'Qty'];
  let x = 50;
  let y = tableTop;
  headers.forEach((header, i) => {
    page.drawText(header, {
      x,
      y,
      size: 10,
      font,
      color: rgb(0, 0, 0),
    });
    x += colWidths[i];
  });

  // Table rows (details)
  y -= rowHeight;
  for (const d of details) {
    x = 50;
    page.drawText(d.title, { x, y, size: 10, font, color: rgb(0, 0, 0) });
    x += colWidths[0];
    page.drawText(d.category, { x, y, size: 10, font, color: rgb(0, 0, 0) });
    x += colWidths[1];
    page.drawText(`Rp${d.saleAmount.toLocaleString('id-ID')}`, { x, y, size: 10, font, color: rgb(0, 0, 0) });
    x += colWidths[2];
    page.drawText(d.orderAmount.toString(), { x, y, size: 10, font, color: rgb(0, 0, 0) });
    x += colWidths[3];
    page.drawText(d.itemCount.toString(), { x, y, size: 10, font, color: rgb(0, 0, 0) });
    y -= rowHeight;
  }

  // Summary
  y -= rowHeight;
  page.drawText('Total Penjualan Bruto:', { x: 50, y, size: 10, font, color: rgb(0, 0, 0) });
  page.drawText(`Rp${summary.totalSalesBruto.toLocaleString('id-ID')}`, { x: 200, y, size: 10, font, color: rgb(0, 0, 0) });
  y -= rowHeight;
  page.drawText('Total Diskon:', { x: 50, y, size: 10, font, color: rgb(0, 0, 0) });
  page.drawText(`Rp${summary.totalDiscounts.toLocaleString('id-ID')}`, { x: 200, y, size: 10, font, color: rgb(0, 0, 0) });
  y -= rowHeight;
  page.drawText('Total Penjualan:', { x: 50, y, size: 10, font, color: rgb(0, 0, 0) });
  page.drawText(`Rp${summary.totalSales.toLocaleString('id-ID')}`, { x: 200, y, size: 10, font, color: rgb(0, 0, 0) });
  y -= rowHeight;
  page.drawText('Total Order:', { x: 50, y, size: 10, font, color: rgb(0, 0, 0) });
  page.drawText(summary.totalOrders.toString(), { x: 200, y, size: 10, font, color: rgb(0, 0, 0) });
  y -= rowHeight;
  page.drawText('Total Item:', { x: 50, y, size: 10, font, color: rgb(0, 0, 0) });
  page.drawText(summary.totalItems.toString(), { x: 200, y, size: 10, font, color: rgb(0, 0, 0) });

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}
