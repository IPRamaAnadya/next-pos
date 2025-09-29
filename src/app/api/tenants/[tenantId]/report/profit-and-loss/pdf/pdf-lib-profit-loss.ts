
// No type import needed
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export async function generateProfitAndLossPdf({
  reportTitle,
  period,
  data,
  summary,
}: {
  reportTitle: string;
  period: string;
  data: Array<{
    category: string;
    items: Array<{
      classification: string;
      value: number | null;
      percentage: number | null;
      total: number | null;
    }>;
  }>;
  summary: Array<{
    label: string;
    value: number;
    percentage: number;
  }>;
}) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4 size in points
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
  const colWidths = [120, 120, 100, 100, 100];
  const headers = ['Kategori', 'Klasifikasi', 'Nilai', 'Persentase', 'Total'];
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

  // Table rows (dynamic)
  y -= rowHeight;
  for (const section of data) {
    // Section header (category)
    x = 50;
    page.drawText(section.category, {
      x,
      y,
      size: 10,
      font,
      color: rgb(0, 0, 0),
    });
    y -= rowHeight;
    // Section items
    for (const item of section.items) {
      x = 50;
      // Klasifikasi
      page.drawText(item.classification ?? '', {
        x: x + colWidths[0],
        y,
        size: 10,
        font,
        color: rgb(0, 0, 0),
      });
      // Nilai
      page.drawText(item.value !== null ? `Rp${item.value.toLocaleString('id-ID')}` : '', {
        x: x + colWidths[0] + colWidths[1],
        y,
        size: 10,
        font,
        color: rgb(0, 0, 0),
      });
      // Persentase
      page.drawText(item.percentage !== null ? `${(item.percentage * 100).toFixed(2)}%` : '', {
        x: x + colWidths[0] + colWidths[1] + colWidths[2],
        y,
        size: 10,
        font,
        color: rgb(0, 0, 0),
      });
      // Total
      page.drawText(item.total !== null ? `Rp${item.total.toLocaleString('id-ID')}` : '', {
        x: x + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3],
        y,
        size: 10,
        font,
        color: rgb(0, 0, 0),
      });
      y -= rowHeight;
    }
  }

  // Summary rows
  for (const s of summary) {
    x = 50;
    // Label in first column
    page.drawText(s.label, {
      x,
      y,
      size: 10,
      font,
      color: rgb(0, 0, 0),
    });
    // Persentase
    page.drawText(`${(s.percentage * 100).toFixed(2)}%`, {
      x: x + colWidths[0] + colWidths[1] + colWidths[2],
      y,
      size: 10,
      font,
      color: rgb(0, 0, 0),
    });
    // Value
    page.drawText(`Rp${s.value.toLocaleString('id-ID')}`, {
      x: x + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3],
      y,
      size: 10,
      font,
      color: rgb(0, 0, 0),
    });
    y -= rowHeight;
  }

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}
