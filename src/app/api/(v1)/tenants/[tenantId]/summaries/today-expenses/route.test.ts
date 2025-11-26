import { GET } from './route';
import { NextResponse } from 'next/server';

jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    expense: {
      aggregate: jest.fn(),
    },
  },
}));

jest.mock('@/app/api/utils/jwt', () => ({
  verifyToken: jest.fn(),
}));

const mockPrisma = require('@/lib/prisma').default;
const { verifyToken } = require('@/app/api/utils/jwt');

describe('GET /api/tenants/[tenantId]/summaries/today-expenses', () => {
  const tenantId = 'tenant1';
  const validToken = 'valid.token';
  const decodedToken = { tenantId };
  const url = `http://localhost/api/tenants/${tenantId}/summaries/today-expenses`;

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

  it('should return today\'s total expenses for valid request', async () => {
    mockPrisma.expense.aggregate.mockResolvedValue({ _sum: { amount: { toNumber: () => 1234 } } });
    const req = { headers: { get: () => `Bearer ${validToken}` }, url } as any;
    const res = await GET(req, { params: { tenantId } });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.totalAmount).toBe(1234);
  });

  it('should return 0 if there are no expenses today', async () => {
    mockPrisma.expense.aggregate.mockResolvedValue({ _sum: { amount: null } });
    const req = { headers: { get: () => `Bearer ${validToken}` }, url } as any;
    const res = await GET(req, { params: { tenantId } });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.totalAmount).toBe(0);
  });

  it('should return 500 on internal error', async () => {
    mockPrisma.expense.aggregate.mockRejectedValue(new Error('fail'));
    const req = { headers: { get: () => `Bearer ${validToken}` }, url } as any;
    const res = await GET(req, { params: { tenantId } });
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toMatch(/Internal server error/);
  });
});
