// ─────────────────────────────────────────────
//  Profiles
// ─────────────────────────────────────────────

export interface OrderLogProfile {
  id: string;
  orderId: string;
  staffId: string | null;
  status: string;
  note: string | null;
  createdAt: Date;
}

export interface OrderItemProfile {
  id: string;
  tenantId: string | null;
  orderId: string | null;
  productId: string | null;
  productName: string;
  productPrice: number;
  qty: number;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface OrderProfile {
  id: string;
  tenantId: string | null;
  orderNo: string;
  subtotal: number;
  totalAmount: number;
  grandTotal: number;
  paidAmount: number;
  remainingBalance: number | null;
  change: number | null;
  taxAmount: number | null;
  paymentMethod: string | null;
  paymentStatus: string | null;
  orderStatus: string | null;
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
  lastPointsAccumulation: number | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  items: OrderItemProfile[];
  logs?: OrderLogProfile[];
}

export interface OrderStatusProfile {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  order: number;
  isFinal: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ─────────────────────────────────────────────
//  Input types — Order
// ─────────────────────────────────────────────

export interface CreateOrderItemInput {
  productId?: string;
  productName: string;
  productPrice: number;
  qty: number;
}

export interface CreateOrderInput {
  items: CreateOrderItemInput[];
  paidAmount: number;
  paymentMethod?: string;
  paymentDate?: Date;
  note?: string;
  customerId?: string;
  customerName?: string;
  staffId?: string;
  discountId?: string;
  discountCode?: string;
  taxAmount?: number;
  pointUsed?: number;
  lastPointsAccumulation?: number;
  orderStatus?: string;
}

export interface UpdateOrderInput {
  paidAmount?: number;
  paymentMethod?: string;
  paymentDate?: Date | null;
  note?: string;
  staffId?: string;
  customerName?: string;
}

export interface OrderQueryInput {
  page?: number;
  pageSize?: number;
  search?: string;         // orderNo or customerName
  paymentStatus?: string;
  orderStatus?: string;
  staffId?: string;
  customerId?: string;
  startDate?: string;
  endDate?: string;
}

export interface SetOrderStatusInput {
  status: string;          // OrderStatus.code
  note?: string;
  staffId?: string;
}

// ─────────────────────────────────────────────
//  Input types — OrderStatus
// ─────────────────────────────────────────────

export interface CreateOrderStatusInput {
  code: string;
  name: string;
  order: number;
  isFinal?: boolean;
  isActive?: boolean;
}

export interface UpdateOrderStatusInput {
  code?: string;
  name?: string;
  order?: number;
  isFinal?: boolean;
  isActive?: boolean;
}

export interface OrderStatusQueryInput {
  page?: number;
  pageSize?: number;
  isActive?: boolean;
}
