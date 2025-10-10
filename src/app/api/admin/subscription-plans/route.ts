import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/app/api/utils/jwt';

function getTokenFromReq(req: Request | NextRequest) {
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
    const decoded: any = token ? verifyToken(token) : null;
    if (!token) return NextResponse.json({ error: 'Unauthorized: no token' }, { status: 401 });
    if (!requireAdmin(decoded)) return NextResponse.json({ error: 'Unauthorized: invalid role' }, { status: 401 });

    const plans = await prisma.subscriptionPlan.findMany({ orderBy: { createdAt: 'desc' } });
    return NextResponse.json({ data: plans });
  } catch (error) {
    console.error('GET /api/admin/subscription-plans', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = getTokenFromReq(req as any);
    const decoded: any = token ? verifyToken(token) : null;
    if (!token) return NextResponse.json({ error: 'Unauthorized: no token' }, { status: 401 });
    if (!requireAdmin(decoded)) return NextResponse.json({ error: 'Unauthorized: invalid role' }, { status: 401 });

    const body = await req.json();
    const { name, description, pricePerMonth, pricePerYear, isBetaTest, customLimits } = body;
    if (!name || !pricePerMonth) return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });

    // If creating a beta plan, unset previous beta
    if (isBetaTest) {
      await prisma.subscriptionPlan.updateMany({ where: { isBetaTest: true }, data: { isBetaTest: false } });
    }

    const plan = await prisma.subscriptionPlan.create({
      data: {
        name,
        description: description || null,
        pricePerMonth: pricePerMonth?.toString(),
        pricePerYear: pricePerYear ? pricePerYear.toString() : null,
        isBetaTest: !!isBetaTest,
        customLimits: customLimits || null,
      },
    });

    return NextResponse.json({ data: plan }, { status: 201 });
  } catch (error) {
    console.error('POST /api/admin/subscription-plans', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const token = getTokenFromReq(req as any);
    const decoded: any = token ? verifyToken(token) : null;
    if (!token) return NextResponse.json({ error: 'Unauthorized: no token' }, { status: 401 });
    if (!requireAdmin(decoded)) return NextResponse.json({ error: 'Unauthorized: invalid role' }, { status: 401 });

    const { id, ...updateData } = await req.json();
    if (!id) return NextResponse.json({ error: 'Missing plan id' }, { status: 400 });

    // If update sets isBetaTest true, unset previous beta
    if (updateData.isBetaTest) {
      await prisma.subscriptionPlan.updateMany({ where: { isBetaTest: true }, data: { isBetaTest: false } });
    }

    const updated = await prisma.subscriptionPlan.update({ where: { id }, data: {
      ...('name' in updateData ? { name: updateData.name } : {}),
      ...('description' in updateData ? { description: updateData.description } : {}),
      ...('pricePerMonth' in updateData ? { pricePerMonth: updateData.pricePerMonth?.toString() } : {}),
      ...('pricePerYear' in updateData ? { pricePerYear: updateData.pricePerYear ? updateData.pricePerYear.toString() : null } : {}),
      ...('isBetaTest' in updateData ? { isBetaTest: !!updateData.isBetaTest } : {}),
      ...('customLimits' in updateData ? { customLimits: updateData.customLimits } : {}),
    } });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('PUT /api/admin/subscription-plans', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const token = getTokenFromReq(req as any);
    const decoded: any = token ? verifyToken(token) : null;
    if (!token) return NextResponse.json({ error: 'Unauthorized: no token' }, { status: 401 });
    if (!requireAdmin(decoded)) return NextResponse.json({ error: 'Unauthorized: invalid role' }, { status: 401 });

    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: 'Missing plan id' }, { status: 400 });
    await prisma.subscriptionPlan.delete({ where: { id } });
    return NextResponse.json({}, { status: 204 });
  } catch (error) {
    console.error('DELETE /api/admin/subscription-plans', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
