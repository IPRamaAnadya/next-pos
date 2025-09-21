import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET: List all custom notification templates for a tenant
export async function GET(req: NextRequest, { params }: { params: { tenantId: string } }) {
  const { tenantId } = await params;
  if (!tenantId) return NextResponse.json({ error: 'Missing tenantId' }, { status: 400 });
  const templates = await prisma.notificationTemplate.findMany({
    where: {
      tenantId,
      OR: [
        { isCustom: true },
        { event: null }
      ]
    }
  });
  return NextResponse.json(templates);
}
