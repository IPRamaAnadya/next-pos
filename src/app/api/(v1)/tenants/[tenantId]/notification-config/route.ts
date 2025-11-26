import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Helper to get tenantId from params
function getTenantIdFromParams(params: { tenantId?: string }) {
  return params.tenantId;
}

// GET: Fetch notification config for a tenant
export async function GET(req: NextRequest, { params }: { params: { tenantId: string } }) {
  const tenantId = getTenantIdFromParams(params);
  if (!tenantId) return NextResponse.json({ error: 'Missing tenantId' }, { status: 400 });
  const config = await prisma.tenantNotificationConfig.findUnique({ where: { tenantId } });
  return NextResponse.json(config);
}

// POST: Create notification config for a tenant
export async function POST(req: NextRequest, { params }: { params: { tenantId: string } }) {
  const tenantId = getTenantIdFromParams(params);
  const { provider, apiToken, apiUrl, isActive } = await req.json();
  if (!tenantId || !apiToken) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  const config = await prisma.tenantNotificationConfig.upsert({
    where: { tenantId },
    update: { provider, apiToken, apiUrl, isActive },
    create: { tenantId, provider, apiToken, apiUrl, isActive }
  });
  return NextResponse.json(config, { status: 201 });
}

// PUT: Update notification config for a tenant
export async function PUT(req: NextRequest, { params }: { params: { tenantId: string } }) {
  const tenantId = getTenantIdFromParams(params);
  const updateData = await req.json();
  if (!tenantId) return NextResponse.json({ error: 'Missing tenantId' }, { status: 400 });
  const config = await prisma.tenantNotificationConfig.update({
    where: { tenantId },
    data: updateData
  });
  return NextResponse.json(config);
}
