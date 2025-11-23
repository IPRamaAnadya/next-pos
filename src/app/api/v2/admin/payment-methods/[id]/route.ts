/**
 * API Route: /api/v2/admin/payment-methods/[id]
 * PUT: Update payment method (admin)
 * DELETE: Delete payment method (admin)
 */

import { NextResponse } from "next/server";
import { DonationServiceContainer } from "@/application/services/DonationServiceContainer";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const container = DonationServiceContainer.getInstance();
  return await container.paymentMethodController.updatePaymentMethod(request, id);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const container = DonationServiceContainer.getInstance();
  return await container.paymentMethodController.deletePaymentMethod(request, id);
}
