import { NextRequest } from 'next/server';
import { apiResponse } from '@/app/api/utils/response';
import { verifyToken } from '@/app/api/utils/jwt';

// Service Container
import { OrderServiceContainer } from '../../infrastructure/container/OrderServiceContainer';

// Use Cases (imported through container)
import { GetOrdersUseCase } from '../../application/use-cases/GetOrdersUseCase';
import { GetOrderByIdUseCase } from '../../application/use-cases/GetOrderByIdUseCase';
import { CreateOrderUseCase } from '../../application/use-cases/CreateOrderUseCase';
import { UpdateOrderUseCase } from '../../application/use-cases/UpdateOrderUseCase';
import { DeleteOrderUseCase } from '../../application/use-cases/DeleteOrderUseCase';
import { UpdateOrderStatusByCodeUseCase } from '../../application/use-cases/UpdateOrderStatusByCodeUseCase';

// DTOs and Schemas
import { 
  createOrderRequestSchema, 
  updateOrderRequestSchema, 
  orderQuerySchema,
  CreateOrderRequest,
  UpdateOrderRequest,
  OrderQueryRequest
} from '../dto/OrderRequestDTO';
import { OrderResponseMapper } from '../dto/OrderResponseDTO';

// Domain Errors
import { 
  OrderNotFoundError, 
  OrderValidationError, 
  UnauthorizedError, 
  OrderStatusError,
  SubscriptionLimitError 
} from '../../domain/errors/OrderErrors';

export class OrderController {
  private static instance: OrderController;
  private getOrdersUseCase: GetOrdersUseCase;
  private getOrderByIdUseCase: GetOrderByIdUseCase;
  private createOrderUseCase: CreateOrderUseCase;
  private updateOrderUseCase: UpdateOrderUseCase;
  private deleteOrderUseCase: DeleteOrderUseCase;
  private updateOrderStatusByCodeUseCase: UpdateOrderStatusByCodeUseCase;

  private constructor() {
    // Get dependencies from container
    const container = OrderServiceContainer.getInstance();
    
    // Initialize use cases
    this.getOrdersUseCase = container.getGetOrdersUseCase();
    this.getOrderByIdUseCase = container.getGetOrderByIdUseCase();
    this.createOrderUseCase = container.getCreateOrderUseCase();
    this.updateOrderUseCase = container.getUpdateOrderUseCase();
    this.deleteOrderUseCase = container.getDeleteOrderUseCase();
    this.updateOrderStatusByCodeUseCase = container.getUpdateOrderStatusByCodeUseCase();
  }

  // Singleton pattern to prevent memory leaks from multiple instances
  public static getInstance(): OrderController {
    if (!OrderController.instance) {
      OrderController.instance = new OrderController();
    }
    return OrderController.instance;
  }

  async getOrders(req: NextRequest, tenantId: string) {
    try {
      const tenantIdFromToken = this.validateAndGetTenantId(req, tenantId);

      // Parse and validate query parameters
      const url = new URL(req.url);
      const queryParams = {
        p_limit: parseInt(url.searchParams.get('limit') || url.searchParams.get('p_limit') || '5', 10),
        p_page: parseInt(url.searchParams.get('page') || url.searchParams.get('p_page') || '1', 10),
        p_search: url.searchParams.get('search') || url.searchParams.get('p_search') || undefined,
        p_order_status: url.searchParams.get('orderStatus') || url.searchParams.get('p_order_status') || undefined,
        p_payment_status: url.searchParams.get('paymentStatus') || url.searchParams.get('p_payment_status') || undefined,
        p_customer_name: url.searchParams.get('customerName') || url.searchParams.get('p_customer_name') || undefined,
        p_customer_id: url.searchParams.get('customerId') || url.searchParams.get('p_customer_id') || undefined,
        p_sort_by: url.searchParams.get('sortBy') || url.searchParams.get('p_sort_by') || 'createdAt',
        p_sort_dir: (url.searchParams.get('sortDir') || url.searchParams.get('p_sort_dir') || 'desc') as 'asc' | 'desc',
      };

      const validatedQuery = await orderQuerySchema.validate(queryParams);

      const options = {
        limit: validatedQuery.p_limit!,
        page: validatedQuery.p_page!,
        sortBy: validatedQuery.p_sort_by!, // Let repository handle field mapping
        sortDir: validatedQuery.p_sort_dir!,
        filters: {
          search: validatedQuery.p_search,
          orderStatus: validatedQuery.p_order_status,
          paymentStatus: validatedQuery.p_payment_status,
          customerName: validatedQuery.p_customer_name,
          customerId: validatedQuery.p_customer_id,
        },
      };

      const result = await this.getOrdersUseCase.execute(tenantIdFromToken, options);

      return OrderResponseMapper.mapPaginatedResponse(result);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getOrderById(req: NextRequest, tenantId: string, orderId: string) {
    try {
      const tenantIdFromToken = this.validateAndGetTenantId(req, tenantId);

      const order = await this.getOrderByIdUseCase.execute(orderId, tenantIdFromToken);

      return apiResponse.success({
        data: { order: OrderResponseMapper.toOrderResponse(order) },
        message: 'Order retrieved successfully'
      });
    } catch (error) {
      return this.handleError(error);
    }
  }

  async createOrder(req: NextRequest, tenantId: string) {
    try {
      const tenantIdFromToken = this.validateAndGetTenantId(req, tenantId);

      const body = await req.json();
      
      // Validate request body
      const validatedData = await createOrderRequestSchema.validate(body, { abortEarly: false });

      // Map the validated data to domain types
      const createOrderData = {
        ...validatedData,
        discountType: validatedData.discountType as 'percentage' | 'fixed' | 'point' | null | undefined,
        discountRewardType: validatedData.discountRewardType as 'cash' | 'point' | null | undefined,
        paymentStatus: validatedData.paymentStatus as 'unpaid' | 'paid' | 'partial'
      };

      const order = await this.createOrderUseCase.execute(createOrderData, tenantIdFromToken);

      return apiResponse.success({
        data: { order: OrderResponseMapper.toOrderResponse(order) },
        message: 'Order created successfully'
      });
    } catch (error) {
      return this.handleError(error);
    }
  }

  async updateOrder(req: NextRequest, tenantId: string, orderId: string) {
    try {
      const tenantIdFromToken = this.validateAndGetTenantId(req, tenantId);

      const body = await req.json();
      const dataWithId = { ...body, id: orderId };
      
      // Validate request body
      const validatedData = await updateOrderRequestSchema.validate(dataWithId, { abortEarly: false });

      // Map the validated data to domain types
      const updateOrderData = {
        ...validatedData,
        discountType: validatedData.discountType as 'percentage' | 'fixed' | 'point' | null | undefined,
        discountRewardType: validatedData.discountRewardType as 'cash' | 'point' | null | undefined,
        paymentStatus: validatedData.paymentStatus as 'unpaid' | 'paid' | 'partial'
      };

      const order = await this.updateOrderUseCase.execute(orderId, updateOrderData, tenantIdFromToken);

      return apiResponse.success({
        data: { order: OrderResponseMapper.toOrderResponse(order) },
        message: 'Order updated successfully'
      });
    } catch (error) {
      return this.handleError(error);
    }
  }

  async deleteOrder(req: NextRequest, tenantId: string, orderId: string) {
    try {
      const tenantIdFromToken = this.validateAndGetTenantId(req, tenantId);

      await this.deleteOrderUseCase.execute(orderId, tenantIdFromToken);

      return apiResponse.success({
        message: 'Order deleted successfully'
      });
    } catch (error) {
      return this.handleError(error);
    }
  }

  async updateOrderStatusByCode(req: NextRequest, tenantId: string, orderId: string) {
    try {
      const tenantIdFromToken = this.validateAndGetTenantId(req, tenantId);

      const body = await req.json();

      // Validate request body
      if (!body.statusCode) {
        return apiResponse.validationError([
          { field: 'statusCode', message: 'Status code is required' }
        ]);
      }

      const order = await this.updateOrderStatusByCodeUseCase.execute(
        tenantIdFromToken,
        orderId,
        { statusCode: body.statusCode }
      );

      return apiResponse.success({
        data: { order: OrderResponseMapper.toOrderResponse(order) },
        message: 'Order status updated successfully'
      });
    } catch (error) {
      return this.handleError(error);
    }
  }

  private validateAndGetTenantId(req: NextRequest, tenantId: string): string {
    const token = req.headers.get('authorization')?.split(' ')[1];
    
    if (!token) {
      throw new UnauthorizedError('Authorization token is required');
    }

    const decoded: any = verifyToken(token);
    const tenantIdFromToken = decoded.tenantId;

    if (tenantIdFromToken !== tenantId) {
      throw new UnauthorizedError('Tenant ID mismatch');
    }

    return tenantIdFromToken;
  }

  private handleError(error: unknown) {
    console.error('OrderController Error:', error);

    if (error instanceof OrderNotFoundError) {
      return apiResponse.notFound(error.message);
    }

    if (error instanceof OrderValidationError) {
      return apiResponse.validationError(
        error.details?.map((detail: string) => ({ field: 'general', message: detail })) || 
        [{ field: 'general', message: error.message }]
      );
    }

    if (error instanceof UnauthorizedError) {
      return apiResponse.unauthorized(error.message);
    }

    if (error instanceof OrderStatusError) {
      return apiResponse.forbidden(error.message);
    }

    if (error instanceof SubscriptionLimitError) {
      return apiResponse.forbidden(error.message);
    }

    // Handle Yup validation errors
    if (error && typeof error === 'object' && 'errors' in error) {
      const yupError = error as any;
      return apiResponse.validationError(
        yupError.errors?.map((err: string) => ({ field: 'general', message: err })) || 
        [{ field: 'general', message: 'Validation failed' }]
      );
    }

    return apiResponse.internalError();
  }

  // Clean up method for testing or manual cleanup
  public static cleanup(): void {
    if (OrderController.instance) {
      OrderController.instance = null as any;
    }
  }
}