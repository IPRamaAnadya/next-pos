/**
 * API Route: GET /api/v2/admin/donations
 * Get all donations (admin)
 */

import { NextResponse } from "next/server";
import { DonationServiceContainer } from "@/application/services/DonationServiceContainer";

export async function GET(request: Request) {
  const container = DonationServiceContainer.getInstance();
  return await container.donationController.getAllDonations(request);
}
