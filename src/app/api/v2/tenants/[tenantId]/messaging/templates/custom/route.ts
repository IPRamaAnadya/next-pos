/**
 * API Routes: /api/v2/tenants/[tenantId]/messaging/templates/custom
 * GET - Get only custom message templates (event is null)
 */

import { NextResponse } from "next/server";
import { CustomerMessagingServiceContainer } from "@/application/services/CustomerMessagingServiceContainer";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  try {
    const { tenantId } = await params;
    const container = CustomerMessagingServiceContainer.getInstance();
    
    // Get custom templates controller method
    return await container.customerMessagingController.getCustomMessageTemplates(request, tenantId);
  } catch (error) {
    console.error("Error fetching custom templates:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch custom templates",
      },
      { status: 500 }
    );
  }
}
