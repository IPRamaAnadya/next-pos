import { Decimal } from '@/app/generated/prisma/runtime/library';
import { discountService } from '@/v3/modules/discount/discount.service';
import { orderRepository, orderStatusRepository } from './order.repository';
import type {
  CreateOrderInput,
  UpdateOrderInput,
  OrderQueryInput,
  SetOrderStatusInput,
  OrderStatusQueryInput,
  CreateOrderStatusInput,
  UpdateOrderStatusInput,
} from './order.type';

// ─────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────

function computePaymentStatus(paidAmount: number, grandTotal: number): string {
  if (paidAmount >= grandTotal) return 'paid';
  if (paidAmount > 0) return 'partial';
  return 'unpaid';
}

// ─────────────────────────────────────────────
//  OrderService
// ─────────────────────────────────────────────

class OrderService {
  async listOrders(tenantId: string, query: OrderQueryInput) {
    const { items, total } = await orderRepository.findAll(tenantId, query);
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 20));
    return {
      items: items.map((e) => e.toProfile()),
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
  }

  async getOrder(id: string, tenantId: string) {
    const entity = await orderRepository.findById(id, tenantId);
    if (!entity) throw new Error('Order not found');
    return entity.toProfile(true);
  }

  async createOrder(tenantId: string, input: CreateOrderInput) {
    // 1. Validate items
    if (!input.items?.length) throw new Error('At least one item is required');
    for (const item of input.items) {
      if (!item.productName?.trim()) throw new Error('Each item must have a productName');
      if (item.productPrice == null || item.productPrice <= 0) {
        throw new Error('Each item productPrice must be > 0');
      }
      if (item.qty == null || item.qty <= 0) {
        throw new Error('Each item qty must be > 0');
      }
    }

    if (input.paidAmount == null || input.paidAmount < 0) {
      throw new Error('paidAmount must be >= 0');
    }

    // 2. Compute subtotal
    const subtotal = input.items.reduce((sum, i) => sum + i.productPrice * i.qty, 0);

    // 3. Apply discount
    let discountId: string | null = null;
    let discountName: string | null = null;
    let discountType: string | null = null;
    let discountValue: number | null = null;
    let discountRewardType: string | null = null;
    let discountAmountValue = 0;

    if (input.discountId || input.discountCode) {
      const result = await discountService.validateDiscount(tenantId, {
        discountId: input.discountId,
        code: input.discountCode,
        orderAmount: subtotal,
        isMemberCustomer: !!input.customerId,
      });

      if (!result.isValid) throw new Error(result.reason ?? 'Discount is not valid');

      if (result.discount) {
        discountId = result.discount.id;
        discountName = result.discount.name;
        discountType = result.discount.type;
        discountValue = result.discount.value;
        discountRewardType = result.discount.rewardType ?? null;
        discountAmountValue = result.discountAmount ?? 0;
      }
    }

    // 4. Compute totals
    const taxAmount = input.taxAmount ?? null;
    const totalAmount = subtotal - discountAmountValue;
    const grandTotal = totalAmount + (taxAmount ?? 0);
    const paidAmount = input.paidAmount;
    const paymentStatus = computePaymentStatus(paidAmount, grandTotal);
    const change = paidAmount > grandTotal ? paidAmount - grandTotal : null;
    const remainingBalance = paidAmount < grandTotal ? grandTotal - paidAmount : null;

    // 5. Create
    const entity = await orderRepository.create(tenantId, {
      items: input.items.map((i) => ({
        productId: i.productId,
        productName: i.productName.trim(),
        productPrice: i.productPrice,
        qty: i.qty,
      })),
      subtotal,
      totalAmount,
      grandTotal,
      paidAmount,
      remainingBalance,
      change,
      taxAmount,
      paymentMethod: input.paymentMethod ?? null,
      paymentStatus,
      orderStatus: input.orderStatus ?? 'CONFIRMED',
      paymentDate: input.paymentDate ?? null,
      note: input.note ?? null,
      customerId: input.customerId ?? null,
      customerName: input.customerName ?? null,
      discountId,
      discountName,
      discountType,
      discountValue,
      discountAmount: discountAmountValue > 0 ? discountAmountValue : null,
      discountRewardType,
      pointUsed: input.pointUsed ?? null,
      staffId: input.staffId ?? null,
      lastPointsAccumulation: input.lastPointsAccumulation ?? 0,
    });

    return entity.toProfile(true);
  }

  async updateOrder(id: string, tenantId: string, input: UpdateOrderInput) {
    const existing = await orderRepository.findById(id, tenantId);
    if (!existing) throw new Error('Order not found');

    const profile = existing.toProfile();

    // Recompute payment fields if paidAmount changes
    let paymentStatus: string | undefined;
    let change: Decimal | null | undefined;
    let remainingBalance: Decimal | null | undefined;
    let paidAmountDecimal: Decimal | undefined;

    if (input.paidAmount !== undefined) {
      if (input.paidAmount < 0) throw new Error('paidAmount must be >= 0');
      const grandTotal = profile.grandTotal;
      paymentStatus = computePaymentStatus(input.paidAmount, grandTotal);
      change =
        input.paidAmount > grandTotal ? new Decimal(input.paidAmount - grandTotal) : null;
      remainingBalance =
        input.paidAmount < grandTotal ? new Decimal(grandTotal - input.paidAmount) : null;
      paidAmountDecimal = new Decimal(input.paidAmount);
    }

    const entity = await orderRepository.update(id, tenantId, {
      ...(paidAmountDecimal !== undefined && { paidAmount: paidAmountDecimal }),
      ...(remainingBalance !== undefined && { remainingBalance }),
      ...(change !== undefined && { change }),
      ...(paymentStatus !== undefined && { paymentStatus }),
      ...(input.paymentMethod !== undefined && { paymentMethod: input.paymentMethod }),
      ...(input.paymentDate !== undefined && { paymentDate: input.paymentDate }),
      ...(input.note !== undefined && { note: input.note }),
      ...(input.staffId !== undefined && { staffId: input.staffId }),
      ...(input.customerName !== undefined && { customerName: input.customerName }),
    });

    return entity.toProfile(true);
  }

  async setOrderStatus(id: string, tenantId: string, input: SetOrderStatusInput) {
    if (!input.status?.trim()) throw new Error('status is required');

    const existing = await orderRepository.findById(id, tenantId);
    if (!existing) throw new Error('Order not found');

    const entity = await orderRepository.updateStatus(id, tenantId, input.status.trim());

    // Write log
    await orderRepository.addLog(id, input.staffId ?? null, input.status.trim(), input.note);

    return entity.toProfile(true);
  }

  async deleteOrder(id: string, tenantId: string) {
    const existing = await orderRepository.findById(id, tenantId);
    if (!existing) throw new Error('Order not found');
    await orderRepository.delete(id, tenantId);
  }
}

export const orderService = new OrderService();

// ─────────────────────────────────────────────
//  OrderStatusService
// ─────────────────────────────────────────────

class OrderStatusService {
  async listOrderStatuses(tenantId: string, query: OrderStatusQueryInput) {
    const { items, total } = await orderStatusRepository.findAll(tenantId, query);
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 50));
    return {
      items: items.map((e) => e.toProfile()),
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
  }

  async getOrderStatus(id: string, tenantId: string) {
    const entity = await orderStatusRepository.findById(id, tenantId);
    if (!entity) throw new Error('Order status not found');
    return entity.toProfile();
  }

  async createOrderStatus(tenantId: string, input: CreateOrderStatusInput) {
    if (!input.code?.trim()) throw new Error('code is required');
    if (!input.name?.trim()) throw new Error('name is required');
    if (input.order == null) throw new Error('order is required');

    const code = input.code.trim().toUpperCase();

    const dupCode = await orderStatusRepository.findByCode(code, tenantId);
    if (dupCode) throw new Error('An order status with this code already exists');

    const dupName = await orderStatusRepository.findByName(input.name.trim(), tenantId);
    if (dupName) throw new Error('An order status with this name already exists');

    const entity = await orderStatusRepository.create(tenantId, {
      ...input,
      code,
      name: input.name.trim(),
    });
    return entity.toProfile();
  }

  async updateOrderStatus(id: string, tenantId: string, input: UpdateOrderStatusInput) {
    const existing = await orderStatusRepository.findById(id, tenantId);
    if (!existing) throw new Error('Order status not found');

    if (input.code !== undefined) {
      const code = input.code.trim().toUpperCase();
      const dup = await orderStatusRepository.findByCode(code, tenantId, id);
      if (dup) throw new Error('An order status with this code already exists');
      input = { ...input, code };
    }
    if (input.name !== undefined) {
      const trimmedName = input.name.trim();
      input = { ...input, name: trimmedName };
      const dup = await orderStatusRepository.findByName(trimmedName, tenantId, id);
      if (dup) throw new Error('An order status with this name already exists');
    }

    const entity = await orderStatusRepository.update(id, tenantId, input);
    return entity.toProfile();
  }

  async deleteOrderStatus(id: string, tenantId: string) {
    const existing = await orderStatusRepository.findById(id, tenantId);
    if (!existing) throw new Error('Order status not found');

    const count = await orderStatusRepository.countOrdersWithStatus(
      existing.status.code,
      tenantId,
    );
    if (count > 0) {
      throw new Error('Cannot delete an order status that is in use');
    }

    await orderStatusRepository.delete(id, tenantId);
  }
}

export const orderStatusService = new OrderStatusService();
