/**
 * API Route: GET /api/v2/tenants/[tenantId]/donations/[id]
 * Get donation detail
 */

import { NextResponse } from "next/server";
import { DonationServiceContainer } from "@/application/services/DonationServiceContainer";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tenantId: string; id: string }> }
) {
  const { tenantId, id } = await params;
  const container = DonationServiceContainer.getInstance();
  return await container.donationController.getDonationDetail(request, tenantId, id);
}
