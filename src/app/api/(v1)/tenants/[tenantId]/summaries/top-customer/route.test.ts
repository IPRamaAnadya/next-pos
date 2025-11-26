import { GET } from './route';
jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    order: {
      groupBy: jest.fn(),
    },
    customer: {
      findMany: jest.fn(),
    },
  },
}));
jest.mock('@/app/api/utils/jwt', () => ({
  verifyToken: jest.fn(),
}));
const mockPrisma = require('@/lib/prisma').default;
const { verifyToken } = require('@/app/api/utils/jwt');

describe('GET /api/tenants/[tenantId]/summaries/top-customer', () => {
  const tenantId = 'tenant1';
  const validToken = 'valid.token';
  const decodedToken = { tenantId };
  const url = `http://localhost/api/tenants/${tenantId}/summaries/top-customer?limit=2&start_date=2023-01-01&end_date=2023-01-31`;

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

  it('should return top customers for valid request', async () => {
    mockPrisma.order.groupBy.mockResolvedValue([
      { customerId: 'c1', _sum: { grandTotal: { toNumber: () => 1000 } }, _count: { _all: 3 } },
      { customerId: 'c2', _sum: { grandTotal: { toNumber: () => 500 } }, _count: { _all: 2 } },
    ]);
    mockPrisma.customer.findMany.mockResolvedValue([
      { id: 'c1', name: 'Alice', email: 'alice@mail.com', phone: '123' },
      { id: 'c2', name: 'Bob', email: 'bob@mail.com', phone: '456' },
    ]);
    const req = { headers: { get: () => `Bearer ${validToken}` }, url } as any;
    const res = await GET(req, { params: { tenantId } });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.meta.code).toBe(200);
    expect(json.data).toEqual([
      { customerId: 'c1', name: 'Alice', email: 'alice@mail.com', phone: '123', totalSpent: 1000, ordersCount: 3 },
      { customerId: 'c2', name: 'Bob', email: 'bob@mail.com', phone: '456', totalSpent: 500, ordersCount: 2 },
    ]);
  });

  it('should handle customers not found in findMany', async () => {
    mockPrisma.order.groupBy.mockResolvedValue([
      { customerId: 'c1', _sum: { grandTotal: { toNumber: () => 1000 } }, _count: { _all: 3 } },
    ]);
    mockPrisma.customer.findMany.mockResolvedValue([]);
    const req = { headers: { get: () => `Bearer ${validToken}` }, url } as any;
    const res = await GET(req, { params: { tenantId } });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data[0].name).toBe('Unknown');
    expect(json.data[0].totalSpent).toBe(1000);
    expect(json.data[0].ordersCount).toBe(3);
  });

  it('should return empty data if no top customers', async () => {
    mockPrisma.order.groupBy.mockResolvedValue([]);
    mockPrisma.customer.findMany.mockResolvedValue([]);
    const req = { headers: { get: () => `Bearer ${validToken}` }, url } as any;
    const res = await GET(req, { params: { tenantId } });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data).toEqual([]);
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
