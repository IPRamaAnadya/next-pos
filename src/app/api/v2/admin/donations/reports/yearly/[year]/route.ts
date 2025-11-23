/**
 * API Route: GET /api/v2/admin/donations/reports/yearly/[year]
 * Get yearly donation report (admin)
 */

import { NextResponse } from "next/server";
import { DonationServiceContainer } from "@/application/services/DonationServiceContainer";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ year: string }> }
) {
  const { year } = await params;
  const container = DonationServiceContainer.getInstance();
  return await container.donationController.getYearlyReport(
    request,
    parseInt(year)
  );
}
