/**
 * API Route: POST /api/v2/webhooks/midtrans/donation
 * Handle Midtrans webhook for donation payments
 */

import { NextResponse } from "next/server";
import { DonationServiceContainer } from "@/application/services/DonationServiceContainer";
import { verifyWebhookNotification } from "@/lib/midtrans";
import { apiResponse } from "@/app/api/utils/response";

export async function POST(request: Request) {
  try {
    const notification = await request.json();

    // Log received notification for debugging
    console.log("Received Midtrans notification:", JSON.stringify(notification, null, 2));

    // Verify webhook signature
    const isValid = await verifyWebhookNotification(notification);
    if (!isValid) {
      console.error("Invalid webhook signature");
      return apiResponse.unauthorized("Invalid signature");
    }

    const container = DonationServiceContainer.getInstance();
    return await container.donationController.handleWebhook(notification);
  } catch (error: any) {
    console.error("Webhook error:", error);
    return apiResponse.internalError();
  }
}
