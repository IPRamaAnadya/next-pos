/**
 * API Route: GET /api/v2/payment-methods/[id]
 * Get payment method detail (public)
 */

import { NextResponse } from "next/server";
import { DonationServiceContainer } from "@/application/services/DonationServiceContainer";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const container = DonationServiceContainer.getInstance();
  return await container.paymentMethodController.getPaymentMethodDetail(request, id);
}
