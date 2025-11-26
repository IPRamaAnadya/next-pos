import { GET } from './route';
jest.mock('@/lib/prisma', () => ({
  tenantSubscription: { findMany: jest.fn() },
}));

describe('GET /api/subscription/check-duration', () => {
  let req: any;
  beforeEach(() => {
    jest.clearAllMocks();
    req = { url: 'http://localhost' };
  });

  it('should return 200 and list of subscriptions', async () => {
    const prisma = require('@/lib/prisma');
    const subscriptions = [
      { tenantId: 'tenant1', endDate: new Date() },
      { tenantId: 'tenant2', endDate: new Date() },
    ];
    prisma.tenantSubscription.findMany.mockResolvedValue(subscriptions);
    // You may need to implement GET in your API for this test to pass
    const res = await GET(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(Array.isArray(json.data)).toBe(true);
  });

  it('should return 500 on error', async () => {
    const prisma = require('@/lib/prisma');
    prisma.tenantSubscription.findMany.mockImplementation(() => { throw new Error('fail'); });
    const res = await GET(req);
    expect(res.status).toBe(500);
  });
});
