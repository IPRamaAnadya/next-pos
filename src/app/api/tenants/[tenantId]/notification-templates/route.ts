import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET: List all notification templates for a tenant
export async function GET(req: NextRequest, { params }: { params: { tenantId: string } }) {
  const { tenantId } = params;
  if (!tenantId) return NextResponse.json({ error: 'Missing tenantId' }, { status: 400 });
  const templates = await prisma.notificationTemplate.findMany({ where: { tenantId } });
  return NextResponse.json(templates);
}

// POST: Create a notification template for a tenant
export async function POST(req: NextRequest, { params }: { params: { tenantId: string } }) {
  const { tenantId } = params;
  const { name, event, message, isActive, isCustom } = await req.json();
  if (!tenantId || !name || !message) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  const template = await prisma.notificationTemplate.create({
    data: { tenantId, name, event, message, isActive, isCustom }
  });
  return NextResponse.json(template, { status: 201 });
}

// PUT: Update a notification template for a tenant
export async function PUT(req: NextRequest, { params }: { params: { tenantId: string } }) {
  const { tenantId } = params;
  const { id, ...updateData } = await req.json();
  if (!tenantId || !id) return NextResponse.json({ error: 'Missing tenantId or template id' }, { status: 400 });
  const template = await prisma.notificationTemplate.update({
    where: { id },
    data: updateData
  });
  return NextResponse.json(template);
}
