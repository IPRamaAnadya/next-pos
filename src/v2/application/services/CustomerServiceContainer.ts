import { CustomerUseCases } from '../use-cases/CustomerUseCases';
import { PrismaCustomerRepository } from '../../infrastructure/repositories/PrismaCustomerRepository';

export class CustomerServiceContainer {
  private static customerUseCases: CustomerUseCases;

  static getCustomerUseCases(): CustomerUseCases {
    if (!this.customerUseCases) {
      const customerRepository = PrismaCustomerRepository.getInstance();
      this.customerUseCases = CustomerUseCases.getInstance(customerRepository);
    }
    return this.customerUseCases;
  }
}