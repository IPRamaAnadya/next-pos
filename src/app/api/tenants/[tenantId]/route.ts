
// app/api/data/tenants/[tenantId]/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/app/api/utils/jwt';

export async function GET(req: Request, { params }: { params: { tenantId: string } }) {
  try {
    // Ambil JWT dari header otorisasi
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    // Verifikasi token dan ambil tenantId dari payload
    const decoded: any = verifyToken(token as string);
    if (!decoded || !decoded.tenantId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const tenantIdFromToken = decoded.tenantId;
    const { tenantId } = await params;

    // Pastikan tenantId di URL cocok dengan tenantId di token
    if (tenantIdFromToken !== tenantId) {
      return NextResponse.json({ error: 'Unauthorized: Tenant ID mismatch' }, { status: 403 });
    }

    // Ambil data tenant dari database
    const tenant = await prisma.tenant.findUnique({
      where: {
        id: tenantId,
      },
      include: {
        settings: {
          select: {
            showDiscount: true,
            showTax: true,
          },
        },
        subscription: {
          include: {
            subscriptionPlan: true,
          }
        },
        subscriptionPayments: true,
        payrollSettings: true,
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const safeTenant = JSON.parse(JSON.stringify(tenant));
    return NextResponse.json(safeTenant, { status: 200 });
  } catch (error) {
    console.log('Error fetching tenant:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: { tenantId: string } }) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const decoded: any = verifyToken(token as string);
    if (!decoded || !decoded.tenantId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const tenantIdFromToken = decoded.tenantId;
    const { tenantId } = params;

    if (tenantIdFromToken !== tenantId) {
      return NextResponse.json({ error: 'Unauthorized: Tenant ID mismatch' }, { status: 403 });
    }

    const body = await req.json();
    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.address !== undefined) updateData.address = body.address;
    if (body.phone !== undefined) updateData.phone = body.phone;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const updatedTenant = await prisma.tenant.update({
      where: { id: tenantId },
      data: updateData,
    });

    return NextResponse.json(updatedTenant, { status: 200 });
  } catch (error) {
    console.log('Error updating tenant:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}