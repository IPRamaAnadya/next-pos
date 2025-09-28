import { GET } from './route';
jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    order: {
      findMany: jest.fn(),
    },
  },
}));
jest.mock('@/app/api/utils/jwt', () => ({
  verifyToken: jest.fn(),
}));
const mockPrisma = require('@/lib/prisma').default;
const { verifyToken } = require('@/app/api/utils/jwt');

describe('GET /api/tenants/[tenantId]/summaries/today-orders', () => {
  const tenantId = 'tenant1';
  const validToken = 'valid.token';
  const decodedToken = { tenantId };
  const url = `http://localhost/api/tenants/${tenantId}/summaries/today-orders`;

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
    expect(json.meta.code).toBe(403);
    expect(json.data).toEqual([]);
  });

  it('should return today\'s orders in correct format', async () => {
    mockPrisma.order.findMany.mockResolvedValue([
      {
        grandTotal: { toNumber: () => 1000 },
        paymentDate: new Date('2025-09-28T10:00:00Z'),
        customer: { name: 'Alice' },
      },
      {
        grandTotal: { toNumber: () => 500 },
        paymentDate: new Date('2025-09-28T12:00:00Z'),
        customer: { name: 'Bob' },
      },
    ]);
    const req = { headers: { get: () => `Bearer ${validToken}` }, url } as any;
    const res = await GET(req, { params: { tenantId } });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.meta.code).toBe(200);
    expect(json.data).toEqual([
      { grand_total: 1000, payment_date: '2025-09-28T10:00:00.000Z', customer_name: 'Alice' },
      { grand_total: 500, payment_date: '2025-09-28T12:00:00.000Z', customer_name: 'Bob' },
    ]);
  });

  it('should handle empty orders', async () => {
    mockPrisma.order.findMany.mockResolvedValue([]);
    const req = { headers: { get: () => `Bearer ${validToken}` }, url } as any;
    const res = await GET(req, { params: { tenantId } });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data).toEqual([]);
  });

  it('should return 500 on internal error', async () => {
    mockPrisma.order.findMany.mockRejectedValue(new Error('fail'));
    const req = { headers: { get: () => `Bearer ${validToken}` }, url } as any;
    const res = await GET(req, { params: { tenantId } });
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.meta.code).toBe(500);
    expect(json.data).toEqual([]);
  });
});
