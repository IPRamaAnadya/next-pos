/**
 * API Route: GET /api/v2/messaging/providers
 * Get available messaging providers (no tenant authentication required)
 */

import { CustomerMessagingServiceContainer } from "@/v2/application/services/CustomerMessagingServiceContainer";

export async function GET(request: Request) {
  const container = CustomerMessagingServiceContainer.getInstance();
  return await container.customerMessagingController.getAvailableProviders(request);
}
