import { GET } from './route';
jest.mock('@/lib/prisma', () => ({
  tenantSubscriptionHistory: { findMany: jest.fn() },
}));

describe('GET /api/subscription/history', () => {
  let req: any;
  beforeEach(() => {
    jest.clearAllMocks();
    req = { url: 'http://localhost?tenantId=tenant1' };
  });

  it('should return 400 if tenantId is missing', async () => {
    req.url = 'http://localhost';
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it('should return 200 and subscription histories', async () => {
    const prisma = require('@/lib/prisma');
    const histories = [{ id: 1 }, { id: 2 }];
    prisma.tenantSubscriptionHistory.findMany.mockResolvedValue(histories);
    const res = await GET(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(Array.isArray(json.data)).toBe(true);
  });

  it('should return 500 on error', async () => {
    const prisma = require('@/lib/prisma');
    prisma.tenantSubscriptionHistory.findMany.mockImplementation(() => { throw new Error('fail'); });
    const res = await GET(req);
    expect(res.status).toBe(500);
  });
});
