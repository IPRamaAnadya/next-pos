import { POST } from './route';
jest.mock('@/lib/prisma', () => ({
  tenant: { findUnique: jest.fn() },
  subscriptionPlan: { findUnique: jest.fn() },
  $transaction: jest.fn((cb: any) => cb({
    tenantSubscriptionHistory: { create: jest.fn().mockResolvedValue({ id: 'subHist1' }) },
    subscriptionPayment: { create: jest.fn() },
  })),
}));
jest.mock('@/lib/midtrans', () => ({ createSnapTransaction: jest.fn() }));

describe('POST /api/subscription/payment', () => {
  let req: any;
  beforeEach(() => {
    jest.clearAllMocks();
    req = { json: jest.fn() };
  });

  it('should return 400 if required fields are missing', async () => {
    req.json.mockResolvedValue({});
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('should return 404 if tenant or plan not found', async () => {
    req.json.mockResolvedValue({ tenantId: 't1', planId: 'p1', durationInMonth: 1 });
    const prisma = require('@/lib/prisma');
    prisma.tenant.findUnique.mockResolvedValue(null);
    prisma.subscriptionPlan.findUnique.mockResolvedValue(null);
    const res = await POST(req);
    expect(res.status).toBe(404);
  });

  it('should return 200 and snapToken on success', async () => {
    req.json.mockResolvedValue({ tenantId: 't1', planId: 'p1', durationInMonth: 1 });
    const prisma = require('@/lib/prisma');
    const { createSnapTransaction } = require('@/lib/midtrans');
    prisma.tenant.findUnique.mockResolvedValue({ name: 'Tenant', email: 'a@b.com', phone: '123' });
    prisma.subscriptionPlan.findUnique.mockResolvedValue({ id: 'p1', name: 'Plan', pricePerMonth: { toNumber: () => 1000 }, pricePerYear: { toNumber: () => 10000 } });
    createSnapTransaction.mockResolvedValue('token123');
    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.snapToken).toBe('token123');
  });

  it('should return 500 on error', async () => {
    req.json.mockImplementation(() => { throw new Error('fail'); });
    const res = await POST(req);
    expect(res.status).toBe(500);
  });
});
