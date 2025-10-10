import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/app/api/utils/jwt';
import bcrypt from 'bcryptjs';

function getTokenFromReq(req: Request | NextRequest) {
  // Prefer NextRequest cookie API when available (safer)
  try {
    const maybeCookies = (req as any).cookies;
    if (maybeCookies && typeof maybeCookies.get === 'function') {
      const c = maybeCookies.get('token')?.value;
      if (c) return decodeURIComponent(c);
    }
  } catch (e) {
    // ignore
  }

  const authHeader = (req as any).headers?.get?.('authorization') || '';
  const cookieHeader = (req as any).headers?.get?.('cookie') || '';
  const tokenFromHeader = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
  const cookieMatch = cookieHeader.match(/token=([^;]+)/);
  const tokenFromCookie = cookieMatch ? decodeURIComponent(cookieMatch[1]) : null;
  return tokenFromHeader || tokenFromCookie || null;
}

function requireAdmin(decoded: any) {
  if (!decoded) return false;
  return decoded.role === 'SUPERADMIN' || decoded.role === 'ADMIN';
}

export async function GET(req: NextRequest) {
  try {
    const token = getTokenFromReq(req as any);
    console.debug('GET /api/admin/tenants - token present?', !!token);
    const decoded: any = token ? verifyToken(token) : null;
    console.debug('GET /api/admin/tenants - decoded:', decoded);
    if (!token) return NextResponse.json({ error: 'Unauthorized: no token' }, { status: 401 });
    if (!requireAdmin(decoded)) return NextResponse.json({ error: 'Unauthorized: invalid token or role' }, { status: 401 });

    const tenants = await prisma.tenant.findMany({
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, email: true, address: true, phone: true, subscribedUntil: true, isSubscribed: true, createdAt: true },
    });
    return NextResponse.json({ data: tenants });
  } catch (error) {
    console.error('GET /api/admin/tenants', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = getTokenFromReq(req as any);
    const decoded: any = token ? verifyToken(token) : null;
    if (!requireAdmin(decoded)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { name, email, address, phone, ownerEmail, ownerPassword } = body;
    if (!name || !email) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

    let user = await prisma.user.findUnique({ where: { email: ownerEmail || email } });
    if (!user) {
      if (!ownerPassword) return NextResponse.json({ error: 'Missing owner password' }, { status: 400 });
      const hashed = await bcrypt.hash(ownerPassword, 10);
      user = await prisma.user.create({ data: { email: ownerEmail || email, password: hashed } });
    }

    const tenant = await prisma.tenant.create({ data: { name, email, address, phone, userId: user.id, isSubscribed: false } });
    return NextResponse.json({ tenant }, { status: 201 });
  } catch (error) {
    console.error('POST /api/admin/tenants', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const token = getTokenFromReq(req as any);
    const decoded: any = token ? verifyToken(token) : null;
    if (!requireAdmin(decoded)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id, ...updateData } = await req.json();
    if (!id) return NextResponse.json({ error: 'Missing tenant id' }, { status: 400 });
    const updated = await prisma.tenant.update({ where: { id }, data: updateData });
    return NextResponse.json(updated);
  } catch (error) {
    console.error('PUT /api/admin/tenants', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const token = getTokenFromReq(req as any);
    const decoded: any = token ? verifyToken(token) : null;
    if (!requireAdmin(decoded)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: 'Missing tenant id' }, { status: 400 });
    await prisma.tenant.delete({ where: { id } });
    return NextResponse.json({}, { status: 204 });
  } catch (error) {
    console.error('DELETE /api/admin/tenants', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
