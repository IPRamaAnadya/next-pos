import { POST } from './route';
import { NextRequest } from 'next/server';

jest.mock('@/lib/prisma', () => ({
  order: { create: jest.fn(), findUnique: jest.fn(), update: jest.fn(), count: jest.fn(), findMany: jest.fn() },
  orderItem: { createMany: jest.fn() },
  customer: { update: jest.fn(), findUnique: jest.fn() },
  $transaction: jest.fn((cb) => cb(require('@/lib/prisma'))),
}));
jest.mock('@/app/api/utils/jwt', () => ({ verifyToken: jest.fn() }));
jest.mock('@/utils/validation/orderSchema', () => ({ orderCreateSchema: { validate: jest.fn() } }));
jest.mock('@/lib/orderNotificationService', () => ({ sendOrderNotification: jest.fn() }));

describe('POST /api/tenants/[tenantId]/orders', () => {
  const tenantId = 'tenant1';
  const token = 'valid.token';
  const orderId = 'order1';
  const customerId = 'customer1';
  const orderBody = {
    grandTotal: 100000,
    paidAmount: 100000,
    paymentStatus: 'paid',
    customerId,
    orderItems: [
      { productName: 'Product A', productId: 'prod1', productPrice: 50000, qty: 2 },
    ],
  };
  let req: any;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      headers: { get: jest.fn((k: string) => k === 'authorization' ? `Bearer ${token}` : undefined) },
      json: jest.fn(),
      url: 'http://localhost',
    };
  });

  it('should return 403 if tenantId mismatch', async () => {
    const { verifyToken } = require('@/app/api/utils/jwt');
    verifyToken.mockReturnValue({ tenantId: 'otherTenant' });
    req.json.mockResolvedValue(orderBody);
    const res = await POST(req, { params: { tenantId } });
    expect(res.status).toBe(403);
  });

  it('should return 400 if validation fails', async () => {
    const { verifyToken } = require('@/app/api/utils/jwt');
    const { orderCreateSchema } = require('@/utils/validation/orderSchema');
    verifyToken.mockReturnValue({ tenantId });
    req.json.mockResolvedValue(orderBody);
    orderCreateSchema.validate.mockRejectedValue({ errors: ['error1'] });
    const res = await POST(req, { params: { tenantId } });
    expect(res.status).toBe(400);
  });

  it('should create order and send paid notification', async () => {
    const { verifyToken } = require('@/app/api/utils/jwt');
    const { orderCreateSchema } = require('@/utils/validation/orderSchema');
    const prisma = require('@/lib/prisma');
    const { sendOrderNotification } = require('@/lib/orderNotificationService');
    verifyToken.mockReturnValue({ tenantId });
    req.json.mockResolvedValue(orderBody);
    orderCreateSchema.validate.mockResolvedValue(true);
    prisma.order.create.mockResolvedValue({ id: orderId, ...orderBody });
    prisma.orderItem.createMany.mockResolvedValue({});
    prisma.customer.update.mockResolvedValue({});
    prisma.customer.findUnique.mockResolvedValue({ id: customerId, points: 10, phone: '0812', name: 'John' });
    prisma.order.findUnique.mockResolvedValue({ id: orderId, ...orderBody, items: orderBody.orderItems, customerId });
    sendOrderNotification.mockResolvedValue({});
    prisma.order.update.mockResolvedValue({});
    const res = await POST(req, { params: { tenantId } });
    expect(res.status).toBe(201);
    expect(sendOrderNotification).toHaveBeenCalledWith(expect.objectContaining({ event: 'ORDER_PAID' }));
  });

  it('should create order and send created notification if not paid', async () => {
    const { verifyToken } = require('@/app/api/utils/jwt');
    const { orderCreateSchema } = require('@/utils/validation/orderSchema');
    const prisma = require('@/lib/prisma');
    const { sendOrderNotification } = require('@/lib/orderNotificationService');
    verifyToken.mockReturnValue({ tenantId });
    const unpaidBody = { ...orderBody, paymentStatus: 'unpaid' };
    req.json.mockResolvedValue(unpaidBody);
    orderCreateSchema.validate.mockResolvedValue(true);
    prisma.order.create.mockResolvedValue({ id: orderId, ...unpaidBody });
    prisma.orderItem.createMany.mockResolvedValue({});
    prisma.customer.findUnique.mockResolvedValue({ id: customerId, points: 10, phone: '0812', name: 'John' });
    prisma.order.findUnique.mockResolvedValue({ id: orderId, ...unpaidBody, items: unpaidBody.orderItems, customerId });
    sendOrderNotification.mockResolvedValue({});
    prisma.order.update.mockResolvedValue({});
    const res = await POST(req, { params: { tenantId } });
    expect(res.status).toBe(201);
    expect(sendOrderNotification).toHaveBeenCalledWith(expect.objectContaining({ event: 'ORDER_CREATED' }));
  });

  it('should handle customer points logic', async () => {
    const { verifyToken } = require('@/app/api/utils/jwt');
    const { orderCreateSchema } = require('@/utils/validation/orderSchema');
    const prisma = require('@/lib/prisma');
    verifyToken.mockReturnValue({ tenantId });
    const pointsBody = { ...orderBody, pointUsed: 5, discountRewardType: 'point', discountAmount: 2 };
    req.json.mockResolvedValue(pointsBody);
    orderCreateSchema.validate.mockResolvedValue(true);
    prisma.order.create.mockResolvedValue({ id: orderId, ...pointsBody });
    prisma.orderItem.createMany.mockResolvedValue({});
    prisma.customer.update.mockResolvedValue({});
    prisma.customer.findUnique.mockResolvedValue({ id: customerId, points: 7 });
    prisma.order.findUnique.mockResolvedValue({ id: orderId, ...pointsBody, items: pointsBody.orderItems, customerId });
    prisma.order.update.mockResolvedValue({});
    const res = await POST(req, { params: { tenantId } });
    expect(res.status).toBe(201);
    expect(prisma.customer.update).toHaveBeenCalled();
    expect(prisma.order.update).toHaveBeenCalled();
  });

  it('should return 500 on error', async () => {
    const { verifyToken } = require('@/app/api/utils/jwt');
    verifyToken.mockImplementation(() => { throw new Error('fail'); });
    const res = await POST(req, { params: { tenantId } });
    expect(res.status).toBe(500);
  });

  it('should return correct grandTotal, paidAmount, discountAmount, remainingBalance, and change', async () => {
    const { verifyToken } = require('@/app/api/utils/jwt');
    const { orderCreateSchema } = require('@/utils/validation/orderSchema');
    const prisma = require('@/lib/prisma');
    const { sendOrderNotification } = require('@/lib/orderNotificationService');
    verifyToken.mockReturnValue({ tenantId });
    const customOrderBody = {
      grandTotal: 150000,
      paidAmount: 120000,
      discountAmount: 30000,
      paymentStatus: 'unpaid',
      customerId,
      orderItems: [
        { productName: 'Product B', productId: 'prod2', productPrice: 75000, qty: 2 },
      ],
    };
    req.json.mockResolvedValue(customOrderBody);
    orderCreateSchema.validate.mockResolvedValue(true);
    // Simulate DB create and find
    prisma.order.create.mockResolvedValue({ id: orderId, ...customOrderBody });
    prisma.orderItem.createMany.mockResolvedValue({});
    prisma.customer.findUnique.mockResolvedValue({ id: customerId, points: 10, phone: '0812', name: 'John' });
    prisma.order.findUnique.mockResolvedValue({
      id: orderId,
      ...customOrderBody,
      items: customOrderBody.orderItems,
      remainingBalance: 30000,
      change: 0,
    });
    sendOrderNotification.mockResolvedValue({});
    prisma.order.update.mockResolvedValue({});
    const res = await POST(req, { params: { tenantId } });
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.data.order.grandTotal).toBe(150000);
    expect(json.data.order.paidAmount).toBe(120000);
    expect(json.data.order.discountAmount).toBe(30000);
    expect(json.data.order.remainingBalance).toBe(30000);
    expect(json.data.order.change).toBe(0);
    expect(json.data.order.items[0].productPrice).toBe(75000);
    expect(json.data.order.items[0].qty).toBe(2);
  });
});
