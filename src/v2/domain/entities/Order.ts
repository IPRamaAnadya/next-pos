export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productPrice: number;
  qty: number;
  totalPrice: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Order {
  id: string;
  tenantId: string;
  orderNo: string;
  grandTotal: number;
  subtotal: number;
  totalAmount: number;
  paidAmount: number;
  remainingBalance?: number;
  change?: number;
  taxAmount?: number;
  paymentMethod?: string;
  paymentStatus: 'unpaid' | 'paid' | 'partial';
  orderStatus: string;
  paymentDate?: Date;
  note?: string;
  createdAt?: Date;
  updatedAt?: Date;
  customerId?: string;
  customerName?: string;
  discountId?: string;
  discountName?: string;
  discountType?: 'percentage' | 'fixed' | 'point';
  discountValue?: number;
  discountAmount?: number;
  discountRewardType?: 'cash' | 'point';
  pointUsed?: number;
  staffId: string;
  lastPointsAccumulation?: number;
  items: OrderItem[];
}

export interface CreateOrderData {
  customerName?: string;
  customerId?: string | null;
  discountId?: string | null;
  discountName?: string | null;
  discountType?: 'percentage' | 'fixed' | 'point' | null;
  discountRewardType?: 'cash' | 'point' | null;
  discountValue?: number | null;
  discountAmount?: number | null;
  subtotal: number;
  taxAmount?: number;
  totalAmount: number;
  grandTotal: number;
  pointUsed?: number | null;
  paidAmount: number;
  change: number;
  paymentMethod?: string | null;
  paymentStatus: 'unpaid' | 'paid' | 'partial';
  orderStatus: string;
  staffId: string;
  note?: string | null;
  orderItems: {
    productId: string;
    productName: string;
    productPrice: number;
    qty: number;
  }[];
}

export interface UpdateOrderData extends CreateOrderData {
  id: string;
}

export interface OrderFilters {
  search?: string; // Search across customerName and customerId
  orderStatus?: string;
  paymentStatus?: string;
  customerName?: string;
  customerId?: string;
}

export interface OrderQueryOptions {
  limit: number;
  page: number;
  sortBy: string;
  sortDir: 'asc' | 'desc';
  filters?: OrderFilters;
}

export interface PaginatedOrders {
  orders: Order[];
  pagination: {
    totalData: number;
    perPage: number;
    currentPage: number;
    totalPage: number;
    nextPage: number | null;
    prevPage: number | null;
  };
}