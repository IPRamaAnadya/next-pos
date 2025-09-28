import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

function getMonthYearString(date = new Date()) {
	const months = [
		'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
		'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
	];
	return `${months[date.getMonth()]} ${date.getFullYear()}`;
}

import type { NextRequest } from 'next/server';
export async function GET(req: NextRequest, context: { params: { tenantId: string } }) {
		const { tenantId } = await context.params;
		const { searchParams } = new URL(req.url);
		// Accept period as 'YYYY-MM' (e.g., '2025-09')
		const periodParam = searchParams.get('period');
		let year, month;
		if (periodParam) {
			const [y, m] = periodParam.split('-').map(Number);
			year = y;
			month = m - 1; // JS Date month is 0-based
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
	const pajak = Math.round((totalPendapatan - totalBeban) * 0.11);
	const labaSebelumPajak = totalPendapatan - totalBeban;
	const labaBersih = labaSebelumPajak - pajak;

	const response = {
		meta: {
			status: 200,
			message: '',
		},
		data: {
			reportTitle: 'Laporan Laba Rugi Toki Laundry',
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
		},
	};

	return NextResponse.json(response);
}
