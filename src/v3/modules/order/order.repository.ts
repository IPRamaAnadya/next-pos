import prisma from '@/v3/lib/prisma';
import { Decimal } from '@/app/generated/prisma/runtime/library';
import { OrderEntity, OrderStatusEntity } from './order.entity';
import type {
  OrderQueryInput,
  CreateOrderItemInput,
  OrderStatusQueryInput,
  CreateOrderStatusInput,
  UpdateOrderStatusInput,
} from './order.type';

// ─────────────────────────────────────────────
//  Internal data shapes
// ─────────────────────────────────────────────

export interface CreateOrderData {
  items: CreateOrderItemInput[];
  subtotal: number;
  totalAmount: number;
  grandTotal: number;
  paidAmount: number;
  remainingBalance: number | null;
  change: number | null;
  taxAmount: number | null;
  paymentMethod: string | null;
  paymentStatus: string;
  orderStatus: string;
  paymentDate: Date | null;
  note: string | null;
  customerId: string | null;
  customerName: string | null;
  discountId: string | null;
  discountName: string | null;
  discountType: string | null;
  discountValue: number | null;
  discountAmount: number | null;
  discountRewardType: string | null;
  pointUsed: number | null;
  staffId: string | null;
  lastPointsAccumulation: number;
}

// ─────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────

function generateOrderNo(): string {
  return '0' + Date.now().toString(36).toUpperCase();
}

const orderInclude = {
  items: true,
  orderLogs: { orderBy: { createdAt: 'desc' as const } },
} as const;

const orderListInclude = { items: true } as const;

// ─────────────────────────────────────────────
//  Order repository
// ─────────────────────────────────────────────

class PrismaOrderRepository {
  async findAll(
    tenantId: string,
    query: OrderQueryInput,
  ): Promise<{ items: OrderEntity[]; total: number }> {
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 20));
    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = { tenantId };
    if (query.search) {
      where.OR = [
        { orderNo: { contains: query.search, mode: 'insensitive' } },
        { customerName: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.paymentStatus) where.paymentStatus = query.paymentStatus;
    if (query.orderStatus) where.orderStatus = query.orderStatus;
    if (query.staffId) where.staffId = query.staffId;
    if (query.customerId) where.customerId = query.customerId;
    if (query.startDate || query.endDate) {
      const dateFilter: Record<string, Date> = {};
      if (query.startDate) dateFilter.gte = new Date(query.startDate);
      if (query.endDate) dateFilter.lte = new Date(query.endDate);
      where.createdAt = dateFilter;
    }

    const [rows, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: orderListInclude,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.order.count({ where }),
    ]);

    return { items: rows.map((r) => new OrderEntity(r)), total };
  }

  async findById(id: string, tenantId: string): Promise<OrderEntity | null> {
    const row = await prisma.order.findFirst({
      where: { id, tenantId },
      include: orderInclude,
    });
    return row ? new OrderEntity(row) : null;
  }

  async create(tenantId: string, data: CreateOrderData): Promise<OrderEntity> {
    const orderNo = generateOrderNo();

    const result = await prisma.$transaction(async (tx) => {
      // Create order
      const order = await tx.order.create({
        data: {
          tenantId,
          orderNo,
          subtotal: new Decimal(data.subtotal),
          totalAmount: new Decimal(data.totalAmount),
          grandTotal: new Decimal(data.grandTotal),
          paidAmount: new Decimal(data.paidAmount),
          remainingBalance: data.remainingBalance != null ? new Decimal(data.remainingBalance) : null,
          change: data.change != null ? new Decimal(data.change) : null,
          taxAmount: data.taxAmount != null ? new Decimal(data.taxAmount) : null,
          paymentMethod: data.paymentMethod,
          paymentStatus: data.paymentStatus,
          orderStatus: data.orderStatus,
          paymentDate: data.paymentDate,
          note: data.note ?? '',
          customerId: data.customerId,
          customerName: data.customerName,
          discountId: data.discountId,
          discountName: data.discountName,
          discountType: data.discountType,
          discountValue: data.discountValue != null ? new Decimal(data.discountValue) : null,
          discountAmount: data.discountAmount != null ? new Decimal(data.discountAmount) : null,
          discountRewardType: data.discountRewardType,
          pointUsed: data.pointUsed,
          staffId: data.staffId,
          lastPointsAccumulation: data.lastPointsAccumulation,
        },
      });

      // Create items
      await tx.orderItem.createMany({
        data: data.items.map((item) => ({
          tenantId,
          orderId: order.id,
          productId: item.productId ?? null,
          productName: item.productName,
          productPrice: new Decimal(item.productPrice),
          qty: new Decimal(item.qty),
        })),
      });

      // Deduct stock for countable products
      for (const item of data.items) {
        if (item.productId) {
          await tx.product.updateMany({
            where: { id: item.productId, tenantId, isCountable: true },
            data: { stock: { decrement: Math.round(item.qty) } },
          });
        }
      }

      // Handle customer points and lastPurchaseAt
      if (data.customerId) {
        const pointAdjust: Record<string, unknown> = { lastPurchaseAt: new Date() };
        if (data.pointUsed && data.pointUsed > 0) {
          pointAdjust.points = { decrement: data.pointUsed };
        }
        await tx.customer.updateMany({
          where: { id: data.customerId },
          data: pointAdjust,
        });
        if (data.lastPointsAccumulation > 0) {
          await tx.customer.updateMany({
            where: { id: data.customerId },
            data: { points: { increment: data.lastPointsAccumulation } },
          });
        }
      }

      // Reload
      return tx.order.findFirst({
        where: { id: order.id },
        include: orderInclude,
      });
    });

    return new OrderEntity(result!);
  }

  async update(
    id: string,
    tenantId: string,
    data: {
      paidAmount?: Decimal;
      remainingBalance?: Decimal | null;
      change?: Decimal | null;
      grandTotal?: Decimal;
      paymentMethod?: string | null;
      paymentStatus?: string;
      paymentDate?: Date | null;
      note?: string;
      staffId?: string | null;
      customerName?: string | null;
    },
  ): Promise<OrderEntity> {
    const row = await prisma.order.update({
      where: { id },
      data: {
        ...(data.paidAmount !== undefined && { paidAmount: data.paidAmount }),
        ...(data.remainingBalance !== undefined && { remainingBalance: data.remainingBalance }),
        ...(data.change !== undefined && { change: data.change }),
        ...(data.grandTotal !== undefined && { grandTotal: data.grandTotal }),
        ...(data.paymentMethod !== undefined && { paymentMethod: data.paymentMethod }),
        ...(data.paymentStatus !== undefined && { paymentStatus: data.paymentStatus }),
        ...(data.paymentDate !== undefined && { paymentDate: data.paymentDate }),
        ...(data.note !== undefined && { note: data.note }),
        ...(data.staffId !== undefined && { staffId: data.staffId }),
        ...(data.customerName !== undefined && { customerName: data.customerName }),
      },
      include: orderInclude,
    });
    return new OrderEntity(row);
  }

  async updateStatus(id: string, tenantId: string, status: string): Promise<OrderEntity> {
    const row = await prisma.order.update({
      where: { id },
      data: { orderStatus: status },
      include: orderInclude,
    });
    return new OrderEntity(row);
  }

  async addLog(orderId: string, staffId: string | null, status: string, note?: string): Promise<void> {
    await prisma.orderLog.create({
      data: { orderId, staffId: staffId ?? null, status, note: note ?? null },
    });
  }

  async delete(id: string, tenantId: string): Promise<void> {
    await prisma.order.deleteMany({ where: { id, tenantId } });
  }
}

export const orderRepository = new PrismaOrderRepository();

// ─────────────────────────────────────────────
//  OrderStatus repository
// ─────────────────────────────────────────────

class PrismaOrderStatusRepository {
  async findAll(
    tenantId: string,
    query: OrderStatusQueryInput,
  ): Promise<{ items: OrderStatusEntity[]; total: number }> {
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 50));
    const skip = (page - 1) * pageSize;

    const where = {
      tenantId,
      ...(query.isActive !== undefined && { isActive: query.isActive }),
    };

    const [rows, total] = await Promise.all([
      prisma.orderStatus.findMany({ where, orderBy: { order: 'asc' }, skip, take: pageSize }),
      prisma.orderStatus.count({ where }),
    ]);

    return { items: rows.map((r) => new OrderStatusEntity(r)), total };
  }

  async findById(id: string, tenantId: string): Promise<OrderStatusEntity | null> {
    const row = await prisma.orderStatus.findFirst({ where: { id, tenantId } });
    return row ? new OrderStatusEntity(row) : null;
  }

  async findByCode(code: string, tenantId: string, excludeId?: string): Promise<OrderStatusEntity | null> {
    const row = await prisma.orderStatus.findFirst({
      where: { code, tenantId, ...(excludeId && { id: { not: excludeId } }) },
    });
    return row ? new OrderStatusEntity(row) : null;
  }

  async findByName(name: string, tenantId: string, excludeId?: string): Promise<OrderStatusEntity | null> {
    const row = await prisma.orderStatus.findFirst({
      where: { name, tenantId, ...(excludeId && { id: { not: excludeId } }) },
    });
    return row ? new OrderStatusEntity(row) : null;
  }

  async countOrdersWithStatus(code: string, tenantId: string): Promise<number> {
    return prisma.order.count({ where: { orderStatus: code, tenantId } });
  }

  async create(tenantId: string, data: CreateOrderStatusInput): Promise<OrderStatusEntity> {
    const row = await prisma.orderStatus.create({
      data: {
        tenantId,
        code: data.code.toUpperCase(),
        name: data.name,
        order: data.order,
        isFinal: data.isFinal ?? false,
        isActive: data.isActive ?? true,
      },
    });
    return new OrderStatusEntity(row);
  }

  async update(
    id: string,
    tenantId: string,
    data: UpdateOrderStatusInput,
  ): Promise<OrderStatusEntity> {
    const row = await prisma.orderStatus.update({
      where: { id },
      data: {
        ...(data.code !== undefined && { code: data.code.toUpperCase() }),
        ...(data.name !== undefined && { name: data.name }),
        ...(data.order !== undefined && { order: data.order }),
        ...(data.isFinal !== undefined && { isFinal: data.isFinal }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });
    return new OrderStatusEntity(row);
  }

  async delete(id: string, tenantId: string): Promise<void> {
    await prisma.orderStatus.deleteMany({ where: { id, tenantId } });
  }
}

export const orderStatusRepository = new PrismaOrderStatusRepository();
