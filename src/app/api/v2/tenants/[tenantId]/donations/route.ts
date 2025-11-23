/**
 * API Route: POST /api/v2/tenants/[tenantId]/donations
 * Create a new donation
 */

import { NextResponse } from "next/server";
import { DonationServiceContainer } from "@/application/services/DonationServiceContainer";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const { tenantId } = await params;
  const container = DonationServiceContainer.getInstance();
  return await container.donationController.createDonation(request, tenantId);
}
