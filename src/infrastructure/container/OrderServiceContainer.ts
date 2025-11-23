// Dependency Injection Container for Clean Architecture

import { PrismaOrderRepository } from '../repositories/PrismaOrderRepository';
import { PrismaCustomerRepository } from '../repositories/PrismaCustomerRepository';
import { OrderNotificationServiceImpl } from '../services/OrderNotificationServiceImpl';
import { SubscriptionLimitServiceImpl } from '../services/SubscriptionLimitServiceImpl';

import { GetOrdersUseCase } from '../../application/use-cases/GetOrdersUseCase';
import { GetOrderByIdUseCase } from '../../application/use-cases/GetOrderByIdUseCase';
import { CreateOrderUseCase } from '../../application/use-cases/CreateOrderUseCase';
import { UpdateOrderUseCase } from '../../application/use-cases/UpdateOrderUseCase';
import { DeleteOrderUseCase } from '../../application/use-cases/DeleteOrderUseCase';

export class OrderServiceContainer {
  private static instance: OrderServiceContainer;
  
  // Repositories
  private _orderRepository!: PrismaOrderRepository;
  private _customerRepository!: PrismaCustomerRepository;
  
  // Services
  private _notificationService!: OrderNotificationServiceImpl;
  private _subscriptionLimitService!: SubscriptionLimitServiceImpl;
  
  // Use Cases
  private _getOrdersUseCase!: GetOrdersUseCase;
  private _getOrderByIdUseCase!: GetOrderByIdUseCase;
  private _createOrderUseCase!: CreateOrderUseCase;
  private _updateOrderUseCase!: UpdateOrderUseCase;
  private _deleteOrderUseCase!: DeleteOrderUseCase;

  private constructor() {
    this.initializeDependencies();
  }

  private initializeDependencies(): void {
    // Initialize repositories using singletons to prevent memory leaks
    this._orderRepository = PrismaOrderRepository.getInstance();
    this._customerRepository = PrismaCustomerRepository.getInstance();
    
    // Initialize services
    this._notificationService = new OrderNotificationServiceImpl();
    this._subscriptionLimitService = new SubscriptionLimitServiceImpl();
    
    // Initialize use cases with dependencies
    this._getOrdersUseCase = new GetOrdersUseCase(this._orderRepository);
    this._getOrderByIdUseCase = new GetOrderByIdUseCase(this._orderRepository);
    this._createOrderUseCase = new CreateOrderUseCase(
      this._orderRepository,
      this._customerRepository,
      this._notificationService,
      this._subscriptionLimitService
    );
    this._updateOrderUseCase = new UpdateOrderUseCase(
      this._orderRepository,
      this._customerRepository,
      this._notificationService
    );
    this._deleteOrderUseCase = new DeleteOrderUseCase(
      this._orderRepository,
      this._customerRepository
    );
  }

  public static getInstance(): OrderServiceContainer {
    if (!OrderServiceContainer.instance) {
      OrderServiceContainer.instance = new OrderServiceContainer();
    }
    return OrderServiceContainer.instance;
  }

  // Getters for use cases
  public getGetOrdersUseCase(): GetOrdersUseCase {
    return this._getOrdersUseCase;
  }

  public getGetOrderByIdUseCase(): GetOrderByIdUseCase {
    return this._getOrderByIdUseCase;
  }

  public getCreateOrderUseCase(): CreateOrderUseCase {
    return this._createOrderUseCase;
  }

  public getUpdateOrderUseCase(): UpdateOrderUseCase {
    return this._updateOrderUseCase;
  }

  public getDeleteOrderUseCase(): DeleteOrderUseCase {
    return this._deleteOrderUseCase;
  }

  // For testing purposes - allow overriding dependencies
  public setOrderRepository(orderRepository: PrismaOrderRepository): void {
    this._orderRepository = orderRepository;
    this._reinitializeUseCases();
  }

  public setCustomerRepository(customerRepository: PrismaCustomerRepository): void {
    this._customerRepository = customerRepository;
    this._reinitializeUseCases();
  }

  public setNotificationService(notificationService: OrderNotificationServiceImpl): void {
    this._notificationService = notificationService;
    this._reinitializeUseCases();
  }

  public setSubscriptionLimitService(subscriptionLimitService: SubscriptionLimitServiceImpl): void {
    this._subscriptionLimitService = subscriptionLimitService;
    this._reinitializeUseCases();
  }

  private _reinitializeUseCases(): void {
    this._getOrdersUseCase = new GetOrdersUseCase(this._orderRepository);
    this._getOrderByIdUseCase = new GetOrderByIdUseCase(this._orderRepository);
    this._createOrderUseCase = new CreateOrderUseCase(
      this._orderRepository,
      this._customerRepository,
      this._notificationService,
      this._subscriptionLimitService
    );
    this._updateOrderUseCase = new UpdateOrderUseCase(
      this._orderRepository,
      this._customerRepository,
      this._notificationService
    );
    this._deleteOrderUseCase = new DeleteOrderUseCase(
      this._orderRepository,
      this._customerRepository
    );
  }

  // Clean up method for testing and preventing memory leaks
  public static cleanup(): void {
    if (OrderServiceContainer.instance) {
      // Clean up repositories
      PrismaOrderRepository.cleanup();
      PrismaCustomerRepository.cleanup();
      
      // Clear the container instance
      OrderServiceContainer.instance = null as any;
    }
  }

  // Method to refresh all dependencies (useful for testing)
  public refreshDependencies(): void {
    this.initializeDependencies();
  }
}