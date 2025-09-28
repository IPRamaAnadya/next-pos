import { GET, PUT } from './route';
import { NextRequest } from 'next/server';

jest.mock('@/lib/prisma', () => ({
  order: { findUnique: jest.fn() },
}));
jest.mock('@/app/api/utils/jwt', () => ({ verifyToken: jest.fn() }));

describe('GET /api/tenants/[tenantId]/orders/[id]', () => {
  const tenantId = 'tenant1';
  const orderId = 'order1';
  const token = 'valid.token';
  let req: any;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      headers: { get: jest.fn((k: string) => k === 'authorization' ? `Bearer ${token}` : undefined) },
      url: 'http://localhost',
    };
  });

  it('should return 403 if tenantId mismatch', async () => {
    const { verifyToken } = require('@/app/api/utils/jwt');
    verifyToken.mockReturnValue({ tenantId: 'otherTenant' });
    const res = await GET(req, { params: { tenantId, id: orderId } });
    expect(res.status).toBe(403);
  });

  it('should return 404 if order not found', async () => {
    const { verifyToken } = require('@/app/api/utils/jwt');
    const prisma = require('@/lib/prisma');
    verifyToken.mockReturnValue({ tenantId });
    prisma.order.findUnique.mockResolvedValue(null);
    const res = await GET(req, { params: { tenantId, id: orderId } });
    expect(res.status).toBe(404);
  });

  it('should return order details with totalPrice for each item', async () => {
    const { verifyToken } = require('@/app/api/utils/jwt');
    const prisma = require('@/lib/prisma');
    verifyToken.mockReturnValue({ tenantId });
    const order = {
      id: orderId,
      tenantId,
      items: [
        { productName: 'A', productPrice: 1000, qty: 2 },
        { productName: 'B', productPrice: 500, qty: 3 },
      ],
    };
    prisma.order.findUnique.mockResolvedValue(order);
    const res = await GET(req, { params: { tenantId, id: orderId } });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.order.items[0].totalPrice).toBe(2000);
    expect(json.data.order.items[1].totalPrice).toBe(1500);
  });

  it('should return 500 on error', async () => {
    const { verifyToken } = require('@/app/api/utils/jwt');
    const prisma = require('@/lib/prisma');
    verifyToken.mockImplementation(() => { throw new Error('fail'); });
    const res = await GET(req, { params: { tenantId, id: orderId } });
    expect(res.status).toBe(500);
  });
});

describe('PUT /api/tenants/[tenantId]/orders/[id]', () => {
  const tenantId = 'tenant1';
  const orderId = 'order1';
  const token = 'valid.token';
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
    req.json.mockResolvedValue({});
    const res = await PUT(req, { params: { tenantId, id: orderId } });
    expect(res.status).toBe(403);
  });

  it('should return 400 if validation fails', async () => {
    const { verifyToken } = require('@/app/api/utils/jwt');
    const { orderUpdateSchema } = require('@/utils/validation/orderSchema');
    verifyToken.mockReturnValue({ tenantId });
    req.json.mockResolvedValue({});
    orderUpdateSchema.validate = jest.fn().mockRejectedValue({ errors: ['error1'] });
    const res = await PUT(req, { params: { tenantId, id: orderId } });
    expect(res.status).toBe(400);
  });

  it('should return 404 if order not found after update', async () => {
    const { verifyToken } = require('@/app/api/utils/jwt');
    const { orderUpdateSchema } = require('@/utils/validation/orderSchema');
    const prisma = require('@/lib/prisma');
    verifyToken.mockReturnValue({ tenantId });
    req.json.mockResolvedValue({ orderItems: [], grandTotal: 1000, paidAmount: 1000, paymentStatus: 'paid' });
    orderUpdateSchema.validate = jest.fn().mockResolvedValue(true);
    prisma.$transaction = jest.fn(cb => cb(prisma));
    prisma.order.findUnique = jest.fn().mockResolvedValueOnce({}) // for previousOrder
      .mockResolvedValueOnce(null); // for after update
    prisma.order.update = jest.fn().mockResolvedValue({});
    prisma.orderItem = { deleteMany: jest.fn(), createMany: jest.fn() };
    const res = await PUT(req, { params: { tenantId, id: orderId } });
    expect(res.status).toBe(404);
  });

  it('should return updated order with items and totalPrice', async () => {
    const { verifyToken } = require('@/app/api/utils/jwt');
    const { orderUpdateSchema } = require('@/utils/validation/orderSchema');
    const prisma = require('@/lib/prisma');
    verifyToken.mockReturnValue({ tenantId });
    const orderItems = [
      { productName: 'A', productPrice: 1000, qty: 2, productId: 'p1' },
      { productName: 'B', productPrice: 500, qty: 3, productId: 'p2' },
    ];
    req.json.mockResolvedValue({ orderItems, grandTotal: 1000, paidAmount: 1000, paymentStatus: 'paid' });
    orderUpdateSchema.validate = jest.fn().mockResolvedValue(true);
    prisma.$transaction = jest.fn(cb => cb(prisma));
    prisma.orderItem = { deleteMany: jest.fn(), createMany: jest.fn() };
    prisma.order.findUnique = jest.fn()
      .mockResolvedValueOnce({}) // for previousOrder
      .mockResolvedValueOnce({
        id: orderId,
        tenantId,
        items: orderItems,
      });
    prisma.order.update = jest.fn().mockResolvedValue({});
    prisma.customer = { update: jest.fn(), findUnique: jest.fn() };
    const res = await PUT(req, { params: { tenantId, id: orderId } });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.order.items[0].totalPrice).toBe(2000);
    expect(json.data.order.items[1].totalPrice).toBe(1500);
  });

  it('should return 500 on error', async () => {
    const { verifyToken } = require('@/app/api/utils/jwt');
    verifyToken.mockImplementation(() => { throw new Error('fail'); });
    req.json.mockResolvedValue({});
    const res = await PUT(req, { params: { tenantId, id: orderId } });
    expect(res.status).toBe(500);
  });
});
