import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendOrderNotification } from '@/lib/orderNotificationService';

// POST: Send custom notification using selected template
export async function POST(req: NextRequest, { params }: { params: { tenantId: string } }) {
  const { tenantId } = params;
  const { templateId, phone, variables } = await req.json();
  if (!tenantId || !templateId || !phone) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

  // Use service to send and log notification
  await sendOrderNotification({
    tenantId,
    variables: { ...variables, phone },
    templateId
  });

  return NextResponse.json({ success: true });
}
