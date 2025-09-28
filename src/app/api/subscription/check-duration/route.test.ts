import { POST } from './route';
jest.mock('@/lib/prisma', () => ({
  tenantSubscription: { findUnique: jest.fn() },
}));

describe('POST /api/subscription/check-duration', () => {
  let req: any;
  const tenantId = 'tenant1';
  beforeEach(() => {
    jest.clearAllMocks();
    req = { json: jest.fn() };
  });

  it('should return 400 if tenantId is missing', async () => {
    req.json.mockResolvedValue({});
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('should return 404 if subscription not found', async () => {
    req.json.mockResolvedValue({ tenantId });
    const prisma = require('@/lib/prisma');
    prisma.tenantSubscription.findUnique.mockResolvedValue(null);
    const res = await POST(req);
    expect(res.status).toBe(404);
  });

  it('should notify if subscription expires in less than 7 days', async () => {
    req.json.mockResolvedValue({ tenantId });
    const prisma = require('@/lib/prisma');
    const endDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 days left
    prisma.tenantSubscription.findUnique.mockResolvedValue({ endDate });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.daysLeft).toBe(3);
  });

  it('should not notify if subscription is valid for more than 7 days', async () => {
    req.json.mockResolvedValue({ tenantId });
    const prisma = require('@/lib/prisma');
    const endDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000); // 10 days left
    prisma.tenantSubscription.findUnique.mockResolvedValue({ endDate });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.daysLeft).toBe(10);
  });

  it('should return 500 on error', async () => {
    req.json.mockImplementation(() => { throw new Error('fail'); });
    const res = await POST(req);
    expect(res.status).toBe(500);
  });
});
