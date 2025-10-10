import jwt from 'jsonwebtoken';
import { getLimitsForTenant, SubscriptionLimitation } from '@/lib/subscriptionLimit';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-strong-secret-key';

export type AuthTokenPayload = {
  userId: string;
  tenantId?: string;
  role?: string;
  staffId?: string | null;
  limits?: SubscriptionLimitation;
  subscriptionEndDate?: string | null;
};

export const generateToken = (payload: object) => {
  return jwt.sign(payload, JWT_SECRET);
};

export const verifyToken = (token: string) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded as AuthTokenPayload;
  } catch (error) {
    return null;
  }
};

/**
 * Create a token payload enriched with subscription limits and end date for a tenant.
 * This is an async helper because it fetches limits from DB once at login.
 */
export async function createAuthPayloadWithLimits(base: Omit<AuthTokenPayload, 'limits' | 'subscriptionEndDate'>) {
  if (!base.tenantId) return base as AuthTokenPayload;
  const limits = await getLimitsForTenant(base.tenantId);
  // fetch tenant subscription end date
  const tenant = await (await import('@/lib/prisma')).default.tenant.findUnique({ where: { id: base.tenantId }, include: { subscription: true } });
  const subscriptionEndDate = tenant?.subscription?.endDate ? new Date(tenant.subscription.endDate).toISOString() : null;
  return {
    ...base,
    limits,
    subscriptionEndDate,
  } as AuthTokenPayload;
}