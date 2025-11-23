/**
 * API Route: GET /api/v2/admin/donations/reports/monthly/[year]/[month]
 * Get monthly donation report (admin)
 */

import { NextResponse } from "next/server";
import { DonationServiceContainer } from "@/application/services/DonationServiceContainer";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ year: string; month: string }> }
) {
  const { year, month } = await params;
  const container = DonationServiceContainer.getInstance();
  return await container.donationController.getMonthlyReport(
    request,
    parseInt(year),
    parseInt(month)
  );
}
