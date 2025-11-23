/**
 * API Route: POST /api/v2/admin/payment-methods/[id]/toggle
 * Toggle payment method active status (admin)
 */

import { NextResponse } from "next/server";
import { DonationServiceContainer } from "@/application/services/DonationServiceContainer";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const container = DonationServiceContainer.getInstance();
  return await container.paymentMethodController.togglePaymentMethodActive(request, id);
}
