import { PrismaOrderStatusRepository } from '../repositories/PrismaOrderStatusRepository';
import {
  GetOrderStatusesUseCase,
  GetOrderStatusByIdUseCase,
  GetOrderStatusByCodeUseCase,
  CreateOrderStatusUseCase,
  UpdateOrderStatusUseCase,
  DeleteOrderStatusUseCase,
  GetDefaultOrderStatusesUseCase,
  ReorderOrderStatusesUseCase,
} from '../../application/use-cases/OrderStatusUseCases';
import { OrderStatusDomainService } from '../../domain/services/OrderStatusDomainService';

export class OrderStatusServiceContainer {
  private static instance: OrderStatusServiceContainer;

  private _repository!: PrismaOrderStatusRepository;
  private _domainService!: OrderStatusDomainService;

  private _getOrderStatusesUseCase!: GetOrderStatusesUseCase;
  private _getOrderStatusByIdUseCase!: GetOrderStatusByIdUseCase;
  private _getOrderStatusByCodeUseCase!: GetOrderStatusByCodeUseCase;
  private _createOrderStatusUseCase!: CreateOrderStatusUseCase;
  private _updateOrderStatusUseCase!: UpdateOrderStatusUseCase;
  private _deleteOrderStatusUseCase!: DeleteOrderStatusUseCase;
  private _getDefaultOrderStatusesUseCase!: GetDefaultOrderStatusesUseCase;
  private _reorderOrderStatusesUseCase!: ReorderOrderStatusesUseCase;

  private constructor() {
    this.initializeDependencies();
  }

  private initializeDependencies(): void {
    this._repository = PrismaOrderStatusRepository.getInstance();
    this._domainService = new OrderStatusDomainService(this._repository);

    this._getOrderStatusesUseCase = new GetOrderStatusesUseCase(this._repository);
    this._getOrderStatusByIdUseCase = new GetOrderStatusByIdUseCase(this._repository);
    this._getOrderStatusByCodeUseCase = new GetOrderStatusByCodeUseCase(this._repository);
    this._createOrderStatusUseCase = new CreateOrderStatusUseCase(this._repository);
    this._updateOrderStatusUseCase = new UpdateOrderStatusUseCase(this._repository);
    this._deleteOrderStatusUseCase = new DeleteOrderStatusUseCase(this._repository);
    this._getDefaultOrderStatusesUseCase = new GetDefaultOrderStatusesUseCase(this._repository);
    this._reorderOrderStatusesUseCase = new ReorderOrderStatusesUseCase(this._repository);
  }

  public static getInstance(): OrderStatusServiceContainer {
    if (!OrderStatusServiceContainer.instance) {
      OrderStatusServiceContainer.instance = new OrderStatusServiceContainer();
    }
    return OrderStatusServiceContainer.instance;
  }

  // Getters for use cases
  public getGetOrderStatusesUseCase(): GetOrderStatusesUseCase {
    return this._getOrderStatusesUseCase;
  }

  public getGetOrderStatusByIdUseCase(): GetOrderStatusByIdUseCase {
    return this._getOrderStatusByIdUseCase;
  }

  public getGetOrderStatusByCodeUseCase(): GetOrderStatusByCodeUseCase {
    return this._getOrderStatusByCodeUseCase;
  }

  public getCreateOrderStatusUseCase(): CreateOrderStatusUseCase {
    return this._createOrderStatusUseCase;
  }

  public getUpdateOrderStatusUseCase(): UpdateOrderStatusUseCase {
    return this._updateOrderStatusUseCase;
  }

  public getDeleteOrderStatusUseCase(): DeleteOrderStatusUseCase {
    return this._deleteOrderStatusUseCase;
  }

  public getGetDefaultOrderStatusesUseCase(): GetDefaultOrderStatusesUseCase {
    return this._getDefaultOrderStatusesUseCase;
  }

  public getReorderOrderStatusesUseCase(): ReorderOrderStatusesUseCase {
    return this._reorderOrderStatusesUseCase;
  }

  public getDomainService(): OrderStatusDomainService {
    return this._domainService;
  }

  public getRepository(): PrismaOrderStatusRepository {
    return this._repository;
  }

  public static cleanup(): void {
    if (OrderStatusServiceContainer.instance) {
      PrismaOrderStatusRepository.cleanup();
      OrderStatusServiceContainer.instance = null as any;
    }
  }
}
