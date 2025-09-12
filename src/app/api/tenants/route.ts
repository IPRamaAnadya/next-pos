import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const tenants = await prisma.tenant.findMany({
      select: { id: true, name: true, email: true },
    });
    return NextResponse.json(tenants, { status: 200 });
  } catch (error) {
    console.error('Error fetching tenants:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
