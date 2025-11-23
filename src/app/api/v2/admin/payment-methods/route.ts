/**
 * API Route: GET /api/v2/admin/payment-methods
 * GET: List all payment methods (admin)
 * POST: Create new payment method (admin)
 */

import { NextResponse } from "next/server";
import { DonationServiceContainer } from "@/application/services/DonationServiceContainer";

export async function GET(request: Request) {
  const container = DonationServiceContainer.getInstance();
  return await container.paymentMethodController.getAllPaymentMethods(request);
}

export async function POST(request: Request) {
  const container = DonationServiceContainer.getInstance();
  return await container.paymentMethodController.createPaymentMethod(request);
}
