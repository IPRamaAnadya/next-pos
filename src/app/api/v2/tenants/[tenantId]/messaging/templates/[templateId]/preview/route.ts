/**
 * API Route: POST /api/v2/tenants/[tenantId]/messaging/templates/[templateId]/preview
 * Preview a message template with variables
 */

import { CustomerMessagingServiceContainer } from "@/application/services/CustomerMessagingServiceContainer";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ tenantId: string; templateId: string }> }
) {
  const { tenantId, templateId } = await params;
  const container = CustomerMessagingServiceContainer.getInstance();
  return await container.customerMessagingController.previewMessageTemplate(request, tenantId, templateId);
}
