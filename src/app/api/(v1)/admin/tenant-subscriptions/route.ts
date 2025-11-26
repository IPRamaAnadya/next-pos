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
  } catch (e) {}
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

// GET: list subscriptions or single by tenantId
export async function GET(req: NextRequest) {
  try {
    const token = getTokenFromReq(req as any);
    const decoded: any = token ? verifyToken(token) : null;
    if (!token) return NextResponse.json({ error: 'Unauthorized: no token' }, { status: 401 });
    if (!requireAdmin(decoded)) return NextResponse.json({ error: 'Unauthorized: invalid role' }, { status: 401 });

    const url = new URL(req.url);
    const tenantId = url.searchParams.get('tenantId');
    if (tenantId) {
      const sub = await prisma.tenantSubscription.findUnique({ where: { tenantId } , include: { subscriptionPlan: true, tenant: true } });
      return NextResponse.json({ data: sub });
    }

    const subs = await prisma.tenantSubscription.findMany({ orderBy: { updatedAt: 'desc' }, include: { subscriptionPlan: true, tenant: true } });
    return NextResponse.json({ data: subs });
  } catch (error) {
    console.error('GET /api/admin/tenant-subscriptions', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: create subscription for tenant
export async function POST(req: NextRequest) {
  try {
    const token = getTokenFromReq(req as any);
    const decoded: any = token ? verifyToken(token) : null;
    if (!token) return NextResponse.json({ error: 'Unauthorized: no token' }, { status: 401 });
    if (!requireAdmin(decoded)) return NextResponse.json({ error: 'Unauthorized: invalid role' }, { status: 401 });

    const body = await req.json();
    const { tenantId, planId, startDate, endDate, status, customLimits } = body;
    if (!tenantId || !planId || !endDate) return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });

    // ensure tenant exists
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

    // if tenant already has subscription, prevent create
    const existing = await prisma.tenantSubscription.findUnique({ where: { tenantId } });
    if (existing) return NextResponse.json({ error: 'Tenant already has a subscription. Use update.' }, { status: 400 });

  const created = await prisma.tenantSubscription.create({ data: { tenantId, planId, startDate: new Date(startDate), endDate: new Date(endDate), status: status || 'active', customLimits: customLimits ?? undefined } });

    // update tenant record
    await prisma.tenant.update({ where: { id: tenantId }, data: { isSubscribed: true, subscribedUntil: new Date(endDate) } });

    // optional history
  await prisma.tenantSubscriptionHistory.create({ data: { tenantId, planId, startDate: new Date(startDate), endDate: new Date(endDate), status: status || 'active', customLimits: customLimits ?? undefined } });

    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    console.error('POST /api/admin/tenant-subscriptions', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT: update subscription (by id or tenantId)
export async function PUT(req: NextRequest) {
  try {
    const token = getTokenFromReq(req as any);
    const decoded: any = token ? verifyToken(token) : null;
    if (!token) return NextResponse.json({ error: 'Unauthorized: no token' }, { status: 401 });
    if (!requireAdmin(decoded)) return NextResponse.json({ error: 'Unauthorized: invalid role' }, { status: 401 });

    const body = await req.json();
    const { id, tenantId, planId, startDate, endDate, status, customLimits } = body;
    if (!id && !tenantId) return NextResponse.json({ error: 'Missing id or tenantId' }, { status: 400 });

    const where = id ? { id } : { tenantId: tenantId as string };
    const existing = await prisma.tenantSubscription.findUnique({ where: where as any });
    if (!existing) return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });

    const updated = await prisma.tenantSubscription.update({ where: where as any, data: {
      ...(planId ? { planId } : {}),
      ...(startDate ? { startDate: new Date(startDate) } : {}),
      ...(endDate ? { endDate: new Date(endDate) } : {}),
      ...(status ? { status } : {}),
      ...('customLimits' in (body || {}) ? { customLimits: customLimits ?? undefined } : {}),
    } });

    // update tenant subscribedUntil and isSubscribed
    if (endDate) {
      await prisma.tenant.update({ where: { id: existing.tenantId }, data: { isSubscribed: true, subscribedUntil: new Date(endDate) } });
    }

    // add history if plan changed
    if (planId && planId !== existing.planId) {
      await prisma.tenantSubscriptionHistory.create({ data: { tenantId: existing.tenantId, planId, startDate: existing.startDate, endDate: existing.endDate, status: existing.status, customLimits: existing.customLimits ?? undefined } });
    }

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('PUT /api/admin/tenant-subscriptions', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: cancel subscription (soft cancel)
export async function DELETE(req: NextRequest) {
  try {
    const token = getTokenFromReq(req as any);
    const decoded: any = token ? verifyToken(token) : null;
    if (!token) return NextResponse.json({ error: 'Unauthorized: no token' }, { status: 401 });
    if (!requireAdmin(decoded)) return NextResponse.json({ error: 'Unauthorized: invalid role' }, { status: 401 });

    // accept tenantId from body or query string
    let body: any = {};
    try {
      body = await req.json();
    } catch (e) {
      // ignore parse errors for empty body
    }

    const url = new URL(req.url);
    const id = body?.id || url.searchParams.get('id');
    const tenantId = body?.tenantId || url.searchParams.get('tenantId');

    if (!id && !tenantId) return NextResponse.json({ error: 'Missing id or tenantId' }, { status: 400 });

    // safer lookup: find first matching by id or tenantId
    const existing = await prisma.tenantSubscription.findFirst({ where: { OR: [id ? { id } : undefined, tenantId ? { tenantId } : undefined ].filter(Boolean) as any } });
    if (!existing) return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });

    // mark subscription as expired/cancelled
    await prisma.tenantSubscription.update({ where: { id: existing.id }, data: { status: 'cancelled', endDate: new Date() } });
    await prisma.tenant.update({ where: { id: existing.tenantId }, data: { isSubscribed: false, subscribedUntil: null } });
    await prisma.tenantSubscriptionHistory.create({ data: { tenantId: existing.tenantId, planId: existing.planId, startDate: existing.startDate, endDate: new Date(), status: 'cancelled', customLimits: existing.customLimits ?? undefined } });

    return NextResponse.json({}, { status: 200 });
  } catch (error) {
    console.error('DELETE /api/admin/tenant-subscriptions', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
