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
    const { tenantId } = params;

    // Pastikan tenantId di URL cocok dengan tenantId di token
    if (tenantIdFromToken !== tenantId) {
      return NextResponse.json({ error: 'Unauthorized: Tenant ID mismatch' }, { status: 403 });
    }

    // Ambil data tenant dari database
    const tenant = await prisma.tenant.findUnique({
      where: {
        id: tenantId,
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    return NextResponse.json(tenant, { status: 200 });
  } catch (error) {
    console.error('Error fetching tenant:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}