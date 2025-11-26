import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// PUT: Update a notification template by id
export async function PUT(req: NextRequest, { params }: { params: { tenantId: string, templateId: string } }) {
  const { tenantId, templateId } = params;
  const updateData = await req.json();
  if (!tenantId || !templateId) return NextResponse.json({ error: 'Missing tenantId or templateId' }, { status: 400 });
  const template = await prisma.notificationTemplate.update({
    where: { id: templateId, tenantId },
    data: updateData,
  });
  return NextResponse.json(template);
}

// DELETE: Delete a notification template by id
export async function DELETE(req: NextRequest, { params }: { params: { tenantId: string, templateId: string } }) {
  const { tenantId, templateId } = params;
  if (!tenantId || !templateId) return NextResponse.json({ error: 'Missing tenantId or templateId' }, { status: 400 });
  await prisma.notificationTemplate.delete({
    where: { id: templateId, tenantId },
  });
  return NextResponse.json({ success: true });
}
