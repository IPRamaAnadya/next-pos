import { NextRequest } from 'next/server';
import { apiResponse } from '@/app/api/utils/response';
import { verifyToken } from '@/app/api/utils/jwt';

import { OrderStatusServiceContainer } from '../../infrastructure/container/OrderStatusServiceContainer';
import {
  GetOrderStatusesUseCase,
  GetOrderStatusByIdUseCase,
  CreateOrderStatusUseCase,
  UpdateOrderStatusUseCase,
  DeleteOrderStatusUseCase,
  ReorderOrderStatusesUseCase,
} from '../../application/use-cases/OrderStatusUseCases';
import {
  createOrderStatusRequestSchema,
  updateOrderStatusRequestSchema,
  orderStatusQuerySchema,
  reorderOrderStatusesRequestSchema,
} from '../dto/OrderStatusRequestDTO';
import { OrderStatusResponseMapper } from '../dto/OrderStatusResponseDTO';

export class OrderStatusController {
  private static instance: OrderStatusController;
  private getOrderStatusesUseCase: GetOrderStatusesUseCase;
  private getOrderStatusByIdUseCase: GetOrderStatusByIdUseCase;
  private createOrderStatusUseCase: CreateOrderStatusUseCase;
  private updateOrderStatusUseCase: UpdateOrderStatusUseCase;
  private deleteOrderStatusUseCase: DeleteOrderStatusUseCase;
  private reorderOrderStatusesUseCase: ReorderOrderStatusesUseCase;

  private constructor() {
    const container = OrderStatusServiceContainer.getInstance();
    this.getOrderStatusesUseCase = container.getGetOrderStatusesUseCase();
    this.getOrderStatusByIdUseCase = container.getGetOrderStatusByIdUseCase();
    this.createOrderStatusUseCase = container.getCreateOrderStatusUseCase();
    this.updateOrderStatusUseCase = container.getUpdateOrderStatusUseCase();
    this.deleteOrderStatusUseCase = container.getDeleteOrderStatusUseCase();
    this.reorderOrderStatusesUseCase = container.getReorderOrderStatusesUseCase();
  }

  public static getInstance(): OrderStatusController {
    if (!OrderStatusController.instance) {
      OrderStatusController.instance = new OrderStatusController();
    }
    return OrderStatusController.instance;
  }

  async getOrderStatuses(req: NextRequest, tenantId: string) {
    try {
      const tenantIdFromToken = this.validateAndGetTenantId(req, tenantId);

      const url = new URL(req.url);
      const queryParams = {
        p_limit: parseInt(url.searchParams.get('limit') || '10', 10),
        p_page: parseInt(url.searchParams.get('page') || '1', 10),
        p_search: url.searchParams.get('search') || undefined,
        p_is_active: url.searchParams.get('isActive')
          ? url.searchParams.get('isActive') === 'true'
          : undefined,
        p_sort_by: url.searchParams.get('sortBy') || 'order',
        p_sort_dir: (url.searchParams.get('sortDir') || 'asc') as 'asc' | 'desc',
      };

      const validatedQuery = await orderStatusQuerySchema.validate(queryParams);

      const result = await this.getOrderStatusesUseCase.execute(tenantIdFromToken, {
        limit: validatedQuery.p_limit!,
        page: validatedQuery.p_page!,
        sortBy: validatedQuery.p_sort_by as any,
        sortDir: validatedQuery.p_sort_dir!,
        filters: {
          search: validatedQuery.p_search,
          isActive: validatedQuery.p_is_active,
        },
      });

      return apiResponse.success({
        data: {
          statuses: result.data.map(status => OrderStatusResponseMapper.toOrderStatusResponse(status)),
        },
        pagination: {
          page: result.pagination.page,
          pageSize: result.pagination.limit,
          total: result.pagination.total,
        },
        message: 'Order statuses retrieved successfully',
      });
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getOrderStatusById(req: NextRequest, tenantId: string, id: string) {
    try {
      const tenantIdFromToken = this.validateAndGetTenantId(req, tenantId);

      const status = await this.getOrderStatusByIdUseCase.execute(id, tenantIdFromToken);

      if (!status) {
        return apiResponse.notFound(`Order status with ID ${id} not found`);
      }

      return apiResponse.success({
        data: { status: OrderStatusResponseMapper.toOrderStatusResponse(status) },
        message: 'Order status retrieved successfully',
      });
    } catch (error) {
      return this.handleError(error);
    }
  }

  async createOrderStatus(req: NextRequest, tenantId: string) {
    try {
      const tenantIdFromToken = this.validateAndGetTenantId(req, tenantId);

      const body = await req.json();
      const validatedData = await createOrderStatusRequestSchema.validate(body, { abortEarly: false });

      const status = await this.createOrderStatusUseCase.execute(validatedData, tenantIdFromToken);

      return apiResponse.success({
        data: { status: OrderStatusResponseMapper.toOrderStatusResponse(status) },
        message: 'Order status created successfully',
      });
    } catch (error) {
      return this.handleError(error);
    }
  }

  async updateOrderStatus(req: NextRequest, tenantId: string, id: string) {
    try {
      const tenantIdFromToken = this.validateAndGetTenantId(req, tenantId);

      const body = await req.json();
      const validatedData = await updateOrderStatusRequestSchema.validate(body, { abortEarly: false });

      // Verify the status exists and belongs to this tenant
      const existing = await this.getOrderStatusByIdUseCase.execute(id, tenantIdFromToken);
      if (!existing) {
        return apiResponse.notFound(`Order status with ID ${id} not found`);
      }

      const status = await this.updateOrderStatusUseCase.execute(id, validatedData, tenantIdFromToken);

      return apiResponse.success({
        data: { status: OrderStatusResponseMapper.toOrderStatusResponse(status) },
        message: 'Order status updated successfully',
      });
    } catch (error) {
      return this.handleError(error);
    }
  }

  async deleteOrderStatus(req: NextRequest, tenantId: string, id: string) {
    try {
      const tenantIdFromToken = this.validateAndGetTenantId(req, tenantId);

      // Verify the status exists
      const existing = await this.getOrderStatusByIdUseCase.execute(id, tenantIdFromToken);
      if (!existing) {
        return apiResponse.notFound(`Order status with ID ${id} not found`);
      }

      await this.deleteOrderStatusUseCase.execute(id, tenantIdFromToken);

      return apiResponse.success({
        message: 'Order status deleted successfully',
      });
    } catch (error) {
      return this.handleError(error);
    }
  }

  async reorderOrderStatuses(req: NextRequest, tenantId: string) {
    try {
      const tenantIdFromToken = this.validateAndGetTenantId(req, tenantId);

      const body = await req.json();
      const validatedData = await reorderOrderStatusesRequestSchema.validate(body, { abortEarly: false });

      const statuses = await this.reorderOrderStatusesUseCase.execute(
        tenantIdFromToken,
        validatedData.orders
      );

      return apiResponse.success({
        data: {
          statuses: statuses.map(status => OrderStatusResponseMapper.toOrderStatusResponse(status)),
        },
        message: 'Order statuses reordered successfully',
      });
    } catch (error) {
      return this.handleError(error);
    }
  }

  private validateAndGetTenantId(req: NextRequest, tenantId: string): string {
    const token = req.headers.get('authorization')?.split(' ')[1];

    if (!token) {
      throw new Error('Authorization token is required');
    }

    const decoded: any = verifyToken(token);
    const tenantIdFromToken = decoded.tenantId;

    if (tenantIdFromToken !== tenantId) {
      throw new Error('Tenant ID mismatch');
    }

    return tenantIdFromToken;
  }

  private handleError(error: unknown) {
    console.error('OrderStatusController Error:', error);

    if (error && typeof error === 'object' && 'errors' in error) {
      const yupError = error as any;
      return apiResponse.validationError(
        yupError.errors?.map((err: string) => ({ field: 'general', message: err })) || 
        [{ field: 'general', message: 'Validation failed' }]
      );
    }

    if (error instanceof Error) {
      // Handle validation errors from repository
      if (error.message.includes('already exists for this tenant')) {
        return apiResponse.validationError([{ field: 'general', message: error.message }]);
      }
      if (error.message.includes('A final status already exists')) {
        return apiResponse.validationError([{ field: 'general', message: error.message }]);
      }
      if (error.message.includes('Tenant ID mismatch')) {
        return apiResponse.unauthorized(error.message);
      }
      if (error.message.includes('Authorization token')) {
        return apiResponse.unauthorized(error.message);
      }
      if (error.message.includes('not found')) {
        return apiResponse.notFound(error.message);
      }
    }

    return apiResponse.internalError();
  }

  public static cleanup(): void {
    if (OrderStatusController.instance) {
      OrderStatusController.instance = null as any;
    }
  }
}
