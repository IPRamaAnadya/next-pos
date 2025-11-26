import { GET } from './route';
jest.mock('@/lib/prisma', () => ({
  order: { findMany: jest.fn() },
  expense: { findMany: jest.fn() },
}));
jest.mock('@/app/api/utils/jwt', () => ({ verifyToken: jest.fn() }));

describe('GET /api/tenants/[tenantId]/summaries/daily-order', () => {
  const tenantId = 'tenant1';
  const token = 'valid.token';
  let req: any;
  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      headers: { get: jest.fn((k: string) => k === 'authorization' ? `Bearer ${token}` : undefined) },
      url: 'http://localhost?start_date=2025-09-01&end_date=2025-09-28',
    };
  });

  it('should return 403 if tenantId mismatch', async () => {
    const { verifyToken } = require('@/app/api/utils/jwt');
    verifyToken.mockReturnValue({ tenantId: 'otherTenant' });
    const res = await GET(req, { params: { tenantId } });
    expect(res.status).toBe(403);
  });

  it('should return 200 and correct summary for positive data', async () => {
    const { verifyToken } = require('@/app/api/utils/jwt');
    const prisma = require('@/lib/prisma');
    verifyToken.mockReturnValue({ tenantId });
    // Orders: 2 paid, 1 unpaid
    prisma.order.findMany
      .mockResolvedValueOnce([
        { grandTotal: { toNumber: () => 1000 }, paymentStatus: 'paid', paymentMethod: 'cash', createdAt: new Date('2025-09-01'), paymentDate: new Date('2025-09-01') },
        { grandTotal: { toNumber: () => 2000 }, paymentStatus: 'unpaid', paymentMethod: 'cash', createdAt: new Date('2025-09-01'), paymentDate: null },
        { grandTotal: { toNumber: () => 3000 }, paymentStatus: 'paid', paymentMethod: 'card', createdAt: new Date('2025-09-02'), paymentDate: new Date('2025-09-02') },
      ])
      .mockResolvedValueOnce([
        { grandTotal: { toNumber: () => 1000 }, paymentMethod: 'cash', paymentDate: new Date('2025-09-01') },
        { grandTotal: { toNumber: () => 3000 }, paymentMethod: 'card', paymentDate: new Date('2025-09-02') },
      ]);
    prisma.expense.findMany.mockResolvedValue([
      { amount: { toNumber: () => 500 }, paymentType: 'cash', createdAt: new Date('2025-09-01') },
      { amount: { toNumber: () => 200 }, paymentType: 'card', createdAt: new Date('2025-09-02') },
    ]);
    const res = await GET(req, { params: { tenantId } });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.summary.total_ordered_sum).toBe(6000);
    expect(json.data.summary.total_paid_sum).toBe(4000);
    expect(json.data.summary.total_unpaid_sum).toBe(2000);
    expect(json.data.summary.total_payment_received_sum).toBe(4000);
    expect(json.data.summary.total_payment_received_non_cash).toBe(3000);
    expect(json.data.summary.total_expense_sum).toBe(700);
    expect(json.data.daily_transactions.length).toBeGreaterThan(0);
  });

  it('should return 200 and empty summary if no data', async () => {
    const { verifyToken } = require('@/app/api/utils/jwt');
    const prisma = require('@/lib/prisma');
    verifyToken.mockReturnValue({ tenantId });
    prisma.order.findMany.mockResolvedValueOnce([]).mockResolvedValueOnce([]);
    prisma.expense.findMany.mockResolvedValue([]);
    const res = await GET(req, { params: { tenantId } });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.summary.total_ordered_sum).toBe(0);
    expect(json.data.summary.total_paid_sum).toBe(0);
    expect(json.data.summary.total_unpaid_sum).toBe(0);
    expect(json.data.summary.total_payment_received_sum).toBe(0);
    expect(json.data.summary.total_payment_received_non_cash).toBe(0);
    expect(json.data.summary.total_expense_sum).toBe(0);
    expect(json.data.daily_transactions.length).toBe(0);
  });

  it('should return 500 on error', async () => {
    const { verifyToken } = require('@/app/api/utils/jwt');
    const prisma = require('@/lib/prisma');
    verifyToken.mockReturnValue({ tenantId });
    prisma.order.findMany.mockImplementation(() => { throw new Error('fail'); });
    const res = await GET(req, { params: { tenantId } });
    expect(res.status).toBe(500);
  });
});
