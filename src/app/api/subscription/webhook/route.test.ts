import { POST } from './route';
jest.mock('@/lib/prisma', () => ({
  $transaction: jest.fn((cb) => cb(require('@/lib/prisma'))),
  subscriptionPayment: { update: jest.fn() },
  tenantSubscriptionHistory: { update: jest.fn(), findUnique: jest.fn() },
  tenantSubscription: { findUnique: jest.fn() },
  orderItem: { deleteMany: jest.fn() },
  order: { delete: jest.fn() },
  customer: { update: jest.fn() },
}));
jest.mock('@/lib/midtrans', () => ({ verifyWebhookNotification: jest.fn() }));

describe('POST /api/subscription/webhook', () => {
  let req: any;
  beforeEach(() => {
    jest.clearAllMocks();
    req = { json: jest.fn() };
  });

  it('should return 401 if signature is invalid', async () => {
    req.json.mockResolvedValue({});
    const { verifyWebhookNotification } = require('@/lib/midtrans');
    verifyWebhookNotification.mockResolvedValue(false);
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('should return 500 on error', async () => {
    req.json.mockImplementation(() => { throw new Error('fail'); });
    const res = await POST(req);
    expect(res.status).toBe(500);
  });
});
