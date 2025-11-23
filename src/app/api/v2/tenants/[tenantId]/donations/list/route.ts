/**
 * API Route: GET /api/v2/tenants/[tenantId]/donations
 * List tenant donations
 */

import { NextResponse } from "next/server";
import { DonationServiceContainer } from "@/application/services/DonationServiceContainer";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const { tenantId } = await params;
  const container = DonationServiceContainer.getInstance();
  return await container.donationController.getTenantDonations(request, tenantId);
}
