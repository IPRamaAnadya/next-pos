import { OrderStatus } from '@/domain/entities/OrderStatus';

export interface OrderStatusResponse {
  id: string;
  code: string;
  name: string;
  order: number;
  isFinal: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderStatusPaginatedResponse {
  data: OrderStatusResponse[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export class OrderStatusResponseMapper {
  static toOrderStatusResponse(status: OrderStatus): OrderStatusResponse {
    return {
      id: status.id,
      code: status.code,
      name: status.name,
      order: status.order,
      isFinal: status.isFinal,
      isActive: status.isActive,
      createdAt: status.createdAt,
      updatedAt: status.updatedAt,
    };
  }

  static toPaginatedResponse(result: any) {
    return {
      success: true,
      data: {
        statuses: result.data.map((status: OrderStatus) =>
          this.toOrderStatusResponse(status)
        ),
      },
      pagination: result.pagination,
      message: 'Order statuses retrieved successfully',
    };
  }

  static toSuccessResponse(status: OrderStatus, message: string) {
    return {
      success: true,
      data: {
        status: this.toOrderStatusResponse(status),
      },
      message,
    };
  }
}
