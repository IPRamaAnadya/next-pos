import { GET } from './route';
import { NextResponse } from 'next/server';

jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    order: {
      groupBy: jest.fn(),
    },
    expense: {
      groupBy: jest.fn(),
    },
  },
}));

jest.mock('@/app/api/utils/jwt', () => ({
  verifyToken: jest.fn(),
}));

const mockPrisma = require('@/lib/prisma').default;
const { verifyToken } = require('@/app/api/utils/jwt');

describe('GET /api/tenants/[tenantId]/summaries/payment-method', () => {
  const tenantId = 'tenant1';
  const validToken = 'valid.token';
  const decodedToken = { tenantId };
  const url = `http://localhost/api/tenants/${tenantId}/summaries/payment-method?start_date=2023-01-01&end_date=2023-01-31`;

  beforeEach(() => {
    jest.clearAllMocks();
    verifyToken.mockReturnValue(decodedToken);
  });

  it('should return 403 if tenantId in token does not match params', async () => {
    verifyToken.mockReturnValue({ tenantId: 'otherTenant' });
    const req = { headers: { get: () => `Bearer ${validToken}` }, url } as any;
    const res = await GET(req, { params: { tenantId } });
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toMatch(/Unauthorized/);
  });

  it('should return payment and expense summary for valid request', async () => {
    mockPrisma.order.groupBy.mockResolvedValue([
      { paymentMethod: 'cash', _sum: { grandTotal: { toNumber: () => 1000 } } },
      { paymentMethod: 'card', _sum: { grandTotal: { toNumber: () => 500 } } },
    ]);
    mockPrisma.expense.groupBy.mockResolvedValue([
      { paymentType: 'cash', _sum: { amount: { toNumber: () => 200 } } },
      { paymentType: 'transfer', _sum: { amount: { toNumber: () => 300 } } },
    ]);
    const req = { headers: { get: () => `Bearer ${validToken}` }, url } as any;
    const res = await GET(req, { params: { tenantId } });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.meta.code).toBe(200);
    expect(json.data.tenant_id).toBe(tenantId);
    expect(json.data.payment_breakdown).toEqual([
      { payment_method: 'cash', total_grand_total: 1000 },
      { payment_method: 'card', total_grand_total: 500 },
    ]);
    expect(json.data.expense).toEqual([
      { payment_type: 'cash', amount: 200 },
      { payment_type: 'transfer', amount: 300 },
    ]);
  });

  it('should handle empty payment and expense data', async () => {
    mockPrisma.order.groupBy.mockResolvedValue([]);
    mockPrisma.expense.groupBy.mockResolvedValue([]);
    const req = { headers: { get: () => `Bearer ${validToken}` }, url } as any;
    const res = await GET(req, { params: { tenantId } });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.payment_breakdown).toEqual([]);
    expect(json.data.expense).toEqual([]);
  });

  it('should return 500 on internal error', async () => {
    mockPrisma.order.groupBy.mockRejectedValue(new Error('fail'));
    const req = { headers: { get: () => `Bearer ${validToken}` }, url } as any;
    const res = await GET(req, { params: { tenantId } });
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toMatch(/Internal server error/);
  });
});
