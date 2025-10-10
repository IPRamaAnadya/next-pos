import prisma from '@/lib/prisma';

export interface SubscriptionLimitation {
  staff: number;
  product: number;
  transaction: number;
  report: boolean;
  payroll: boolean;
  discount: boolean;
  attendance: boolean;
  online_store: boolean;
}

export const defaultSubscriptionLimitation: SubscriptionLimitation = {
  staff: 2,
  product: 50,
  transaction: 1000,
  report: false,
  payroll: false,
  discount: false,
  attendance: false,
  online_store: false,
};

function mergeLimits(base: SubscriptionLimitation, override?: Partial<SubscriptionLimitation>) {
  if (!override) return base;
  return {
    staff: typeof override.staff === 'number' ? override.staff : base.staff,
    product: typeof override.product === 'number' ? override.product : base.product,
    transaction: typeof override.transaction === 'number' ? override.transaction : base.transaction,
    report: typeof override.report === 'boolean' ? override.report : base.report,
    payroll: typeof override.payroll === 'boolean' ? override.payroll : base.payroll,
    discount: typeof override.discount === 'boolean' ? override.discount : base.discount,
    attendance: typeof override.attendance === 'boolean' ? override.attendance : base.attendance,
    online_store: typeof override.online_store === 'boolean' ? override.online_store : base.online_store,
  };
}

/**
 * Fetch effective limits for a tenant. Merges plan.customLimits, tenantSubscription.customLimits and defaults.
 */
export async function getLimitsForTenant(tenantId: string): Promise<SubscriptionLimitation> {
  const tenantSub = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: {
      subscription: {
        include: { subscriptionPlan: true },
      },
    },
  });

  let limits = { ...defaultSubscriptionLimitation };

  // Plan custom limits
  const planCustom = tenantSub?.subscription?.subscriptionPlan?.customLimits as any | undefined;
  if (planCustom) {
    try {
      limits = mergeLimits(limits, planCustom as Partial<SubscriptionLimitation>);
    } catch (e) {
      // ignore malformed
    }
  }

  // Tenant specific override
  const tenantCustom = tenantSub?.subscription?.customLimits as any | undefined;
  if (tenantCustom) {
    try {
      limits = mergeLimits(limits, tenantCustom as Partial<SubscriptionLimitation>);
    } catch (e) {
      // ignore
    }
  }

  return limits;
}

async function countResource(tenantId: string, resource: keyof SubscriptionLimitation) {
  switch (resource) {
    case 'staff':
      return prisma.staff.count({ where: { tenantId } });
    case 'product':
      return prisma.product.count({ where: { tenantId } });
    case 'transaction':
      return prisma.order.count({ where: { tenantId } });
    default:
      return 0;
  }
}

/**
 * Check whether action is allowed under tenant limits.
 * For numeric resources, provide an optional `increment` (default 1).
 * For boolean features, returns true if feature is enabled.
 */
export async function checkLimit(tenantId: string, resource: keyof SubscriptionLimitation, increment = 1): Promise<boolean> {
  const limits = await getLimitsForTenant(tenantId);
  const limitValue = limits[resource] as any;

  if (typeof limitValue === 'boolean') {
    return Boolean(limitValue);
  }

  const current = await countResource(tenantId, resource);
  return current + increment <= (limitValue as number);
}

/**
 * Enforce limit and throw an Error when not allowed.
 */
export async function enforceLimit(tenantId: string, resource: keyof SubscriptionLimitation, increment = 1) {
  const ok = await checkLimit(tenantId, resource, increment);
  if (!ok) {
    throw new Error(`Subscription limit exceeded for ${resource}`);
  }
}

export default {
  getLimitsForTenant,
  checkLimit,
  enforceLimit,
  defaultSubscriptionLimitation,
};
