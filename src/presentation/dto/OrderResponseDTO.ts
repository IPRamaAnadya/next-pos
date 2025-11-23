import { Order, PaginatedOrders } from '../../domain/entities/Order';

export interface OrderItemResponse {
  id: string;
  productId: string;
  productName: string;
  productPrice: number;
  qty: number;
  totalPrice: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface OrderResponse {
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
  paymentDate?: string;
  note?: string;
  createdAt?: string;
  updatedAt?: string;
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
  items: OrderItemResponse[];
}

export interface OrderListResponse {
  id: string;
  orderNo: string;
  grandTotal: number;
  customerName?: string;
  createdAt?: string;
  orderStatus: string;
  paymentStatus: 'unpaid' | 'paid' | 'partial';
}

export interface PaginationResponse {
  total_data: number;
  per_page: number;
  current_page: number;
  total_page: number;
  next_page: number | null;
  prev_page: number | null;
}

export class OrderResponseMapper {
  static toOrderResponse(order: Order): OrderResponse {
    return {
      id: order.id,
      tenantId: order.tenantId,
      orderNo: order.orderNo,
      grandTotal: order.grandTotal,
      subtotal: order.subtotal,
      totalAmount: order.totalAmount,
      paidAmount: order.paidAmount,
      remainingBalance: order.remainingBalance,
      change: order.change,
      taxAmount: order.taxAmount,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      orderStatus: order.orderStatus,
      paymentDate: order.paymentDate?.toISOString(),
      note: order.note,
      createdAt: order.createdAt?.toISOString(),
      updatedAt: order.updatedAt?.toISOString(),
      customerId: order.customerId,
      customerName: order.customerName,
      discountId: order.discountId,
      discountName: order.discountName,
      discountType: order.discountType,
      discountValue: order.discountValue,
      discountAmount: order.discountAmount,
      discountRewardType: order.discountRewardType,
      pointUsed: order.pointUsed,
      staffId: order.staffId,
      lastPointsAccumulation: order.lastPointsAccumulation,
      items: order.items.map(item => ({
        id: item.id,
        productId: item.productId,
        productName: item.productName,
        productPrice: item.productPrice,
        qty: item.qty,
        totalPrice: item.totalPrice,
        createdAt: item.createdAt?.toISOString(),
        updatedAt: item.updatedAt?.toISOString(),
      })),
    };
  }

  static toOrderListResponse(order: Order): OrderListResponse {
    return {
      id: order.id,
      orderNo: order.orderNo,
      grandTotal: order.grandTotal,
      customerName: order.customerName,
      createdAt: order.createdAt?.toISOString(),
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
    };
  }

  static toPaginationResponse(pagination: PaginatedOrders['pagination']): PaginationResponse {
    return {
      total_data: pagination.totalData,
      per_page: pagination.perPage,
      current_page: pagination.currentPage,
      total_page: pagination.totalPage,
      next_page: pagination.nextPage,
      prev_page: pagination.prevPage,
    };
  }

  static mapPaginatedResponse(paginatedOrders: PaginatedOrders) {
    const { apiResponse } = require('@/app/api/utils/response');
    return apiResponse.success({
      message: 'Orders retrieved successfully',
      data: paginatedOrders.orders.map(order => OrderResponseMapper.toOrderListResponse(order)),
      pagination: {
        page: paginatedOrders.pagination.currentPage,
        pageSize: paginatedOrders.pagination.perPage,
        total: paginatedOrders.pagination.totalData,
      }
    });
  }
}