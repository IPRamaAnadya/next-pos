/**
 * API Route: GET /api/v2/payment-methods
 * List active payment methods (public)
 */

import { NextResponse } from "next/server";
import { DonationServiceContainer } from "@/application/services/DonationServiceContainer";

export async function GET(request: Request) {
  const container = DonationServiceContainer.getInstance();
  return await container.paymentMethodController.getActivePaymentMethods(request);
}
