import type { Order, OrderItem, OrderLog, OrderStatus } from '@/app/generated/prisma';
import { Decimal } from '@/app/generated/prisma/runtime/library';
import type {
  OrderProfile,
  OrderItemProfile,
  OrderLogProfile,
  OrderStatusProfile,
} from './order.type';

// ─────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────

function d2n(v: Decimal | null | undefined): number | null {
  if (v == null) return null;
  return v instanceof Decimal ? v.toNumber() : Number(v);
}

function d2nRequired(v: Decimal): number {
  return v instanceof Decimal ? v.toNumber() : Number(v);
}

// ─────────────────────────────────────────────
//  OrderItemEntity
// ─────────────────────────────────────────────

export class OrderItemEntity {
  constructor(readonly item: OrderItem) {}

  toProfile(): OrderItemProfile {
    const i = this.item;
    return {
      id: i.id,
      tenantId: i.tenantId ?? null,
      orderId: i.orderId ?? null,
      productId: i.productId ?? null,
      productName: i.productName,
      productPrice: d2nRequired(i.productPrice),
      qty: d2nRequired(i.qty),
      createdAt: i.createdAt ?? null,
      updatedAt: i.updatedAt ?? null,
    };
  }
}

// ─────────────────────────────────────────────
//  OrderLogEntity
// ─────────────────────────────────────────────

export class OrderLogEntity {
  constructor(readonly log: OrderLog) {}

  toProfile(): OrderLogProfile {
    const l = this.log;
    return {
      id: l.id,
      orderId: l.orderId,
      staffId: l.staffId ?? null,
      status: l.status,
      note: l.note ?? null,
      createdAt: l.createdAt,
    };
  }
}

// ─────────────────────────────────────────────
//  OrderEntity
// ─────────────────────────────────────────────

export class OrderEntity {
  constructor(
    readonly order: Order & {
      items: OrderItem[];
      orderLogs?: OrderLog[];
    },
  ) {}

  isPaid(): boolean {
    return this.order.paymentStatus === 'paid';
  }

  isPartiallyPaid(): boolean {
    return this.order.paymentStatus === 'partial';
  }

  toProfile(includeLogs = false): OrderProfile {
    const o = this.order;
    return {
      id: o.id,
      tenantId: o.tenantId ?? null,
      orderNo: o.orderNo,
      subtotal: d2nRequired(o.subtotal),
      totalAmount: d2nRequired(o.totalAmount),
      grandTotal: d2nRequired(o.grandTotal),
      paidAmount: d2nRequired(o.paidAmount),
      remainingBalance: d2n(o.remainingBalance),
      change: d2n(o.change),
      taxAmount: d2n(o.taxAmount),
      paymentMethod: o.paymentMethod ?? null,
      paymentStatus: o.paymentStatus ?? null,
      orderStatus: o.orderStatus ?? null,
      paymentDate: o.paymentDate ?? null,
      note: o.note ?? null,
      customerId: o.customerId ?? null,
      customerName: o.customerName ?? null,
      discountId: o.discountId ?? null,
      discountName: o.discountName ?? null,
      discountType: o.discountType ?? null,
      discountValue: d2n(o.discountValue),
      discountAmount: d2n(o.discountAmount),
      discountRewardType: o.discountRewardType ?? null,
      pointUsed: o.pointUsed ?? null,
      staffId: o.staffId ?? null,
      lastPointsAccumulation: o.lastPointsAccumulation ?? null,
      createdAt: o.createdAt ?? null,
      updatedAt: o.updatedAt ?? null,
      items: o.items.map((i) => new OrderItemEntity(i).toProfile()),
      ...(includeLogs && {
        logs: (o.orderLogs ?? []).map((l) => new OrderLogEntity(l).toProfile()),
      }),
    };
  }
}

// ─────────────────────────────────────────────
//  OrderStatusEntity
// ─────────────────────────────────────────────

export class OrderStatusEntity {
  constructor(readonly status: OrderStatus) {}

  toProfile(): OrderStatusProfile {
    const s = this.status;
    return {
      id: s.id,
      tenantId: s.tenantId,
      code: s.code,
      name: s.name,
      order: s.order,
      isFinal: s.isFinal,
      isActive: s.isActive,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    };
  }
}
